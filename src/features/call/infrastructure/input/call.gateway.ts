import { Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  CALL_STATUS_CHANGED_EVENT,
  CallStatusChangedEvent,
} from '../../application/events/call-status-changed.event';
import { CallMapper } from '../../application/mappers/call.mapper';
import type { ICallRepository } from '../../application/ports/call.repository.port';
import { CALL_REPOSITORY_PORT } from '../../application/ports/call.repository.port';
import type { IUserLookup } from '../../application/ports/user-lookup.port';
import { USER_LOOKUP_PORT } from '../../application/ports/user-lookup.port';
import { AcceptCallUseCase } from '../../application/use-cases/accept-call.usecase';
import { DeclineCallUseCase } from '../../application/use-cases/decline-call.usecase';
import { HangupCallUseCase } from '../../application/use-cases/hangup-call.usecase';
import { InitiateCallUseCase } from '../../application/use-cases/initiate-call.usecase';
import { JoinCallUseCase } from '../../application/use-cases/join-call.usecase';
import { CallEntity } from '../../domain/entities/call.entity';
import { CallStatus } from '../../domain/enums/call-status.enum';
import { CallType } from '../../domain/enums/call-type.enum';

/** Délai de sonnerie avant passage automatique en MISSED. */
const RING_TIMEOUT_MS = 30_000;
/** Fenêtre de reprise d'un appel manqué avant passage automatique en ENDED. */
const REJOIN_WINDOW_MS = 5 * 60_000;

interface CallSocketData {
  userId?: number;
}

interface InitiatePayload {
  conversationId: number;
  type: CallType;
}

interface CallIdPayload {
  callId: number;
}

interface SignalPayload {
  callId: number;
  sdp: unknown;
}

interface IcePayload {
  callId: number;
  candidate: unknown;
}

const userRoom = (userId: number): string => `user:${userId}`;

/**
 * Gateway temps réel (Socket.IO, namespace /call) pour la signalisation WebRTC
 * et le cycle de vie des appels.
 * - À la connexion, l'utilisateur (identifié dans le handshake) rejoint sa room
 *   personnelle `user:<id>`, cible des notifications d'appel.
 * - Les events `call:*` orchestrent les use-cases puis notifient les pairs.
 * - Les events `signal:*` relaient le SDP/ICE entre pairs sans toucher au média.
 * - Les minuteries (30s sonnerie, 5min reprise) sont gérées en mémoire ici.
 */
@WebSocketGateway({ namespace: '/call', cors: { origin: '*' } })
export class CallGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(CallGateway.name);

  /** Minuteries de sonnerie (callId → timeout), annulées sur accept/decline/hangup. */
  private readonly ringTimers = new Map<number, NodeJS.Timeout>();
  /** Minuteries de reprise (callId → timeout), annulées sur join/hangup. */
  private readonly rejoinTimers = new Map<number, NodeJS.Timeout>();

  constructor(
    @Inject(CALL_REPOSITORY_PORT)
    private readonly callRepository: ICallRepository,
    @Inject(USER_LOOKUP_PORT)
    private readonly userLookup: IUserLookup,
    private readonly initiateCallUseCase: InitiateCallUseCase,
    private readonly acceptCallUseCase: AcceptCallUseCase,
    private readonly declineCallUseCase: DeclineCallUseCase,
    private readonly hangupCallUseCase: HangupCallUseCase,
    private readonly joinCallUseCase: JoinCallUseCase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  handleConnection(client: Socket): void {
    const userId = this.resolveUserId(client);
    if (userId === null) {
      client.disconnect(true);
      return;
    }
    (client.data as CallSocketData).userId = userId;
    void client.join(userRoom(userId));
  }

  @SubscribeMessage('call:initiate')
  async handleInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: InitiatePayload,
  ) {
    const userId = (client.data as CallSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    // Le contrat du fil accepte « video »/« audio » (casse libre) ; on traduit
    // vers l'enum de domaine (VIDEO/AUDIO) avant de toucher la persistance.
    const type = this.parseCallType(payload.type);
    if (type === null) {
      return {
        error: `Type d'appel invalide : « ${String(payload.type)} » (attendu « video » ou « audio »).`,
      };
    }
    try {
      const call = await this.initiateCallUseCase.execute(
        userId,
        payload.conversationId,
        type,
      );
      const callerName = await this.userLookup.findDisplayName(userId);

      this.server.to(userRoom(call.calleeId)).emit('call:incoming', {
        callId: call.id,
        callerId: call.callerId,
        callerName,
        type: call.type,
        conversationId: call.conversationId,
      });
      this.startRingTimer(call.id);
      this.emitStatusChange(call, null);

      return CallMapper.call_entity_to_call_dto(call);
    } catch (error) {
      return this.toError(error);
    }
  }

  @SubscribeMessage('call:accept')
  async handleAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallIdPayload,
  ) {
    const userId = (client.data as CallSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    try {
      const call = await this.acceptCallUseCase.execute(userId, payload.callId);
      this.clearRingTimer(call.id);
      this.server
        .to(userRoom(call.callerId))
        .emit('call:accepted', { callId: call.id });
      this.emitStatusChange(call, CallStatus.RINGING);
      return CallMapper.call_entity_to_call_dto(call);
    } catch (error) {
      return this.toError(error);
    }
  }

  @SubscribeMessage('call:decline')
  async handleDecline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallIdPayload,
  ) {
    const userId = (client.data as CallSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    try {
      const call = await this.declineCallUseCase.execute(
        userId,
        payload.callId,
      );
      this.clearRingTimer(call.id);
      this.server
        .to(userRoom(call.callerId))
        .emit('call:declined', { callId: call.id });
      this.startRejoinTimer(call.id);
      this.emitStatusChange(call, CallStatus.RINGING);
      return CallMapper.call_entity_to_call_dto(call);
    } catch (error) {
      return this.toError(error);
    }
  }

  @SubscribeMessage('call:hangup')
  async handleHangup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallIdPayload,
  ) {
    const userId = (client.data as CallSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    try {
      const call = await this.hangupCallUseCase.execute(userId, payload.callId);
      this.clearRingTimer(call.id);
      this.clearRejoinTimer(call.id);
      // Le pair (et, pour un raccroché en fenêtre de reprise, les deux) est
      // notifié de la fin de l'appel.
      this.server
        .to(userRoom(call.otherParticipant(userId)))
        .emit('call:ended', { callId: call.id, reason: call.endReason });
      this.emitStatusChange(call, null);
      return CallMapper.call_entity_to_call_dto(call);
    } catch (error) {
      return this.toError(error);
    }
  }

  @SubscribeMessage('call:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallIdPayload,
  ) {
    const userId = (client.data as CallSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    try {
      const call = await this.joinCallUseCase.execute(userId, payload.callId);
      this.clearRejoinTimer(call.id);
      this.server
        .to(userRoom(call.callerId))
        .emit('call:joined', { callId: call.id, userId });
      this.emitStatusChange(call, CallStatus.MISSED);
      return CallMapper.call_entity_to_call_dto(call);
    } catch (error) {
      return this.toError(error);
    }
  }

  @SubscribeMessage('signal:offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SignalPayload,
  ) {
    return this.relaySignal(client, 'signal:offer', payload.callId, {
      callId: payload.callId,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('signal:answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SignalPayload,
  ) {
    return this.relaySignal(client, 'signal:answer', payload.callId, {
      callId: payload.callId,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('signal:ice')
  handleIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: IcePayload,
  ) {
    return this.relaySignal(client, 'signal:ice', payload.callId, {
      callId: payload.callId,
      candidate: payload.candidate,
    });
  }

  /**
   * Relaie un event de signalisation vers l'autre pair après avoir validé que
   * l'émetteur est participant et que l'appel est encore relayable
   * (RINGING ou ACTIVE).
   */
  private async relaySignal(
    client: Socket,
    event: string,
    callId: number,
    payload: Record<string, unknown>,
  ): Promise<{ error: string } | { relayed: true }> {
    const userId = (client.data as CallSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    const call = await this.callRepository.findById(callId);
    if (!call) {
      return { error: `Aucun appel trouvé avec l'identifiant ${callId}.` };
    }
    if (!call.hasParticipant(userId)) {
      return { error: "L'utilisateur n'est pas participant de cet appel." };
    }
    if (call.status === CallStatus.ENDED || call.status === CallStatus.MISSED) {
      return { error: "L'appel n'est plus actif." };
    }
    this.server
      .to(userRoom(call.otherParticipant(userId)))
      .emit(event, payload);
    return { relayed: true };
  }

  /** Minuterie de sonnerie : au bout de 30s, l'appel non décroché passe en MISSED. */
  private startRingTimer(callId: number): void {
    this.clearRingTimer(callId);
    const timer = setTimeout(() => {
      void this.onRingTimeout(callId);
    }, RING_TIMEOUT_MS);
    this.ringTimers.set(callId, timer);
  }

  private clearRingTimer(callId: number): void {
    const timer = this.ringTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.ringTimers.delete(callId);
    }
  }

  /** Minuterie de reprise : au bout de 5min, l'appel manqué passe en ENDED. */
  private startRejoinTimer(callId: number): void {
    this.clearRejoinTimer(callId);
    const timer = setTimeout(() => {
      void this.onRejoinTimeout(callId);
    }, REJOIN_WINDOW_MS);
    this.rejoinTimers.set(callId, timer);
  }

  private clearRejoinTimer(callId: number): void {
    const timer = this.rejoinTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.rejoinTimers.delete(callId);
    }
  }

  /** Callback de fin de sonnerie : RINGING → MISSED (TIMEOUT) puis fenêtre de reprise. */
  private async onRingTimeout(callId: number): Promise<void> {
    this.ringTimers.delete(callId);
    try {
      const call = await this.callRepository.findById(callId);
      if (!call || call.status !== CallStatus.RINGING) {
        return;
      }
      call.timeout();
      const updated = await this.callRepository.update(call);
      this.notifyBoth(updated, 'call:missed', { callId: updated.id });
      this.startRejoinTimer(updated.id);
      this.emitStatusChange(updated, CallStatus.RINGING);
    } catch (error) {
      this.logger.error(
        `Échec du timeout de sonnerie pour l'appel ${callId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Callback de fin de fenêtre de reprise : MISSED → ENDED (REJOIN_TIMEOUT). */
  private async onRejoinTimeout(callId: number): Promise<void> {
    this.rejoinTimers.delete(callId);
    try {
      const call = await this.callRepository.findById(callId);
      if (!call || call.status !== CallStatus.MISSED) {
        return;
      }
      call.expireRejoin();
      const updated = await this.callRepository.update(call);
      this.notifyBoth(updated, 'call:ended', {
        callId: updated.id,
        reason: updated.endReason,
      });
      this.emitStatusChange(updated, CallStatus.MISSED);
    } catch (error) {
      this.logger.error(
        `Échec du timeout de reprise pour l'appel ${callId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Émet un event aux deux participants de l'appel. */
  private notifyBoth(
    call: CallEntity,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    this.server.to(userRoom(call.callerId)).emit(event, payload);
    this.server.to(userRoom(call.calleeId)).emit(event, payload);
  }

  /** Émet l'event interne de changement d'état (point d'extension applicatif). */
  private emitStatusChange(
    call: CallEntity,
    previousStatus: CallStatus | null,
  ): void {
    this.eventEmitter.emit(
      CALL_STATUS_CHANGED_EVENT,
      new CallStatusChangedEvent(
        CallMapper.call_entity_to_call_dto(call),
        previousStatus,
      ),
    );
  }

  /** Normalise le type reçu sur le fil (casse libre) vers l'enum CallType, ou null. */
  private parseCallType(raw: unknown): CallType | null {
    const value = String(raw).toUpperCase();
    return (Object.values(CallType) as string[]).includes(value)
      ? (value as CallType)
      : null;
  }

  private toError(error: unknown): { error: string } {
    return {
      error: error instanceof Error ? error.message : 'Erreur inconnue.',
    };
  }

  private resolveUserId(client: Socket): number | null {
    const auth = client.handshake.auth as Record<string, unknown>;
    const query = client.handshake.query as Record<string, unknown>;
    const raw = auth?.userId ?? query?.userId;
    const userId = Number(raw);
    return raw !== undefined && raw !== null && !Number.isNaN(userId)
      ? userId
      : null;
  }
}
