import { InvalidConversationException } from '../exceptions/invalid-conversation.exception';

/**
 * Entité de domaine d'une conversation directe (1-à-1).
 * Les deux participants sont figés à la création et stockés en paire ordonnée
 * (participantAId < participantBId) afin de garantir l'unicité de la paire.
 */
export class ConversationEntity {
  constructor(
    public readonly id: number,
    public readonly participantAId: number,
    public readonly participantBId: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.participantAId === this.participantBId) {
      throw new InvalidConversationException(
        'Une conversation ne peut pas avoir un seul et même participant.',
      );
    }
    if (this.participantAId > this.participantBId) {
      throw new InvalidConversationException(
        'La paire de participants doit être ordonnée (participantAId < participantBId).',
      );
    }
  }

  /**
   * Normalise une paire d'utilisateurs en paire ordonnée (min, max).
   * Lève si les deux identifiants sont égaux.
   */
  static normalizePair(userId1: number, userId2: number): [number, number] {
    if (userId1 === userId2) {
      throw new InvalidConversationException(
        'Impossible de créer une conversation avec soi-même.',
      );
    }
    return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  }

  /** Indique si l'utilisateur fait partie de la conversation. */
  hasParticipant(userId: number): boolean {
    return this.participantAId === userId || this.participantBId === userId;
  }

  /** Retourne l'identifiant de l'autre participant vis-à-vis de l'appelant. */
  otherParticipant(callerId: number): number {
    return this.participantAId === callerId
      ? this.participantBId
      : this.participantAId;
  }
}
