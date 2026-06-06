import { InvalidMessageException } from '../exceptions/invalid-message.exception';

/**
 * Entité de domaine d'un message texte d'une conversation directe.
 * Les identifiants sont numériques (cohérent avec user_accounts / conversations).
 */
export class MessageEntity {
  constructor(
    public readonly id: number,
    public readonly conversationId: number,
    public readonly authorId: number,
    public readonly content: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly responseToMessageId?: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new InvalidMessageException(
        'Le contenu du message ne peut pas être vide.',
      );
    }
  }
}
