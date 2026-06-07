import { OnEvent } from '@nestjs/event-emitter';
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
  MESSAGE_CREATED_EVENT,
  MessageCreatedEvent,
} from '../../application/events/message-created.event';
import { SendMessageUseCase } from '../../application/use-cases/send-message.usecase';

interface SendMessagePayload {
  conversationId: number;
  content: string;
  responseToMessageId?: number;
}

interface ChatSocketData {
  userId?: number;
}

const roomFor = (userId: number): string => `user:${userId}`;

/**
 * Gateway temps réel (Socket.IO, namespace /chat).
 * - À la connexion, l'utilisateur (identifié dans le handshake) rejoint sa room
 *   personnelle `user:<id>`, stable pour toute la durée de vie de la socket.
 * - L'event entrant `send` passe par le MÊME SendMessageUseCase que le REST.
 * - À chaque message créé (REST ou WS), `@OnEvent` diffuse `message:new` vers la
 *   room de chaque participant — l'appartenance ne dépend donc plus de l'instant
 *   de connexion ni de l'existence de la conversation à ce moment-là.
 */
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly sendMessageUseCase: SendMessageUseCase) {}

  async handleConnection(client: Socket): Promise<void> {
    const userId = this.resolveUserId(client);
    if (userId === null) {
      client.disconnect(true);
      return;
    }

    (client.data as ChatSocketData).userId = userId;
    await client.join(roomFor(userId));
  }

  @SubscribeMessage('send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const userId = (client.data as ChatSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    // Le use-case valide l'appartenance puis émet l'event → diffusion via @OnEvent.
    return this.sendMessageUseCase.execute(
      userId,
      payload.conversationId,
      payload.content,
      payload.responseToMessageId,
    );
  }

  @OnEvent(MESSAGE_CREATED_EVENT)
  broadcastMessage(event: MessageCreatedEvent): void {
    for (const participantId of event.participantIds) {
      this.server.to(roomFor(participantId)).emit('message:new', event.message);
    }
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
