import { CallStatus } from '../enums/call-status.enum';
import { CallType } from '../enums/call-type.enum';
import { EndReason } from '../enums/end-reason.enum';
import { InvalidCallException } from '../exceptions/invalid-call.exception';
import { InvalidCallStateTransitionException } from '../exceptions/invalid-call-state-transition.exception';

/**
 * Transitions autorisées de la machine à états d'un appel.
 * `ENDED` est terminal (aucune sortie).
 */
const VALID_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
  [CallStatus.RINGING]: [
    CallStatus.ACTIVE,
    CallStatus.MISSED,
    CallStatus.ENDED,
  ],
  [CallStatus.ACTIVE]: [CallStatus.ENDED],
  [CallStatus.MISSED]: [CallStatus.ACTIVE, CallStatus.ENDED],
  [CallStatus.ENDED]: [],
};

/**
 * Entité de domaine d'un appel 1-à-1 rattaché à une conversation.
 * Porte la machine à états (RINGING → ACTIVE/MISSED → ENDED) et valide chaque
 * transition au sein du domaine ; les use-cases pilotent ces transitions puis
 * persistent l'entité.
 */
export class CallEntity {
  constructor(
    public readonly id: number,
    public readonly conversationId: number,
    public readonly callerId: number,
    public readonly calleeId: number,
    public status: CallStatus,
    public readonly type: CallType,
    public readonly startedAt: Date,
    public answeredAt: Date | null,
    public endedAt: Date | null,
    public endReason: EndReason | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.callerId === this.calleeId) {
      throw new InvalidCallException(
        'Un appel ne peut pas avoir le même utilisateur comme appelant et appelé.',
      );
    }
  }

  /** Indique si l'utilisateur est l'un des deux participants de l'appel. */
  hasParticipant(userId: number): boolean {
    return this.callerId === userId || this.calleeId === userId;
  }

  isCaller(userId: number): boolean {
    return this.callerId === userId;
  }

  isCallee(userId: number): boolean {
    return this.calleeId === userId;
  }

  /** Retourne l'identifiant de l'autre participant vis-à-vis de l'appelant. */
  otherParticipant(userId: number): number {
    return this.callerId === userId ? this.calleeId : this.callerId;
  }

  /** Applique une transition d'état en la validant contre la machine à états. */
  private transition(to: CallStatus): void {
    if (!VALID_TRANSITIONS[this.status].includes(to)) {
      throw new InvalidCallStateTransitionException(this.status, to);
    }
    this.status = to;
    this.updatedAt = new Date();
  }

  /** Décroché par l'appelé : RINGING → ACTIVE. */
  accept(): void {
    this.transition(CallStatus.ACTIVE);
    this.answeredAt = new Date();
  }

  /** Refus par l'appelé : RINGING → MISSED (end_reason DECLINED). */
  decline(): void {
    this.transition(CallStatus.MISSED);
    this.endReason = EndReason.DECLINED;
  }

  /** Sonnerie expirée (30s) sans réponse : RINGING → MISSED (end_reason TIMEOUT). */
  timeout(): void {
    this.transition(CallStatus.MISSED);
    this.endReason = EndReason.TIMEOUT;
  }

  /** Reprise d'un appel manqué dans la fenêtre de 5 min : MISSED → ACTIVE. */
  join(): void {
    this.transition(CallStatus.ACTIVE);
    this.answeredAt = new Date();
  }

  /** Fenêtre de reprise expirée (5 min) : MISSED → ENDED (end_reason REJOIN_TIMEOUT). */
  expireRejoin(): void {
    this.transition(CallStatus.ENDED);
    this.endedAt = new Date();
    this.endReason = EndReason.REJOIN_TIMEOUT;
  }

  /**
   * Raccroché par un participant (appartenance validée en amont par le use-case).
   * Le motif dépend de l'état courant :
   * - ACTIVE → ENDED (HANGUP)
   * - RINGING (raccroché par l'appelant) → ENDED (CALLER_HANGUP)
   * - MISSED (fenêtre de reprise) → ENDED (CALLER_HANGUP)
   */
  hangup(): void {
    const endReason =
      this.status === CallStatus.ACTIVE
        ? EndReason.HANGUP
        : EndReason.CALLER_HANGUP;
    this.transition(CallStatus.ENDED);
    this.endedAt = new Date();
    this.endReason = endReason;
  }

  /**
   * Termine de force un appel resté en cours après un redémarrage serveur (les
   * minuteries en mémoire sont perdues). Tout statut non terminal passe à ENDED
   * avec un motif cohérent avec son état d'origine.
   */
  expireStale(): void {
    const reason =
      this.status === CallStatus.RINGING
        ? EndReason.TIMEOUT
        : this.status === CallStatus.MISSED
          ? EndReason.REJOIN_TIMEOUT
          : EndReason.HANGUP;
    this.transition(CallStatus.ENDED);
    this.endedAt = new Date();
    this.endReason = reason;
  }

  /** Durée en secondes (answered → ended) si l'appel a été décroché, sinon null. */
  get durationSeconds(): number | null {
    if (!this.answeredAt || !this.endedAt) {
      return null;
    }
    return Math.round(
      (this.endedAt.getTime() - this.answeredAt.getTime()) / 1000,
    );
  }
}
