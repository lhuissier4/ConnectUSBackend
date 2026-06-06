import { MessageEntity } from '../../domain/entities/message.entity';

/**
 * Port de sortie : contrat de persistance des messages.
 * Réalisé par PostgresMessageRepository. Échange des MessageEntity.
 */
export interface IMessageRepository {
  create(message: {
    conversationId: number;
    authorId: number;
    content: string;
    responseToMessageId?: number;
  }): Promise<MessageEntity>;

  findById(id: number): Promise<MessageEntity | null>;

  /**
   * Messages d'une conversation, pagination par curseur.
   * Sans `before` : les `limit` messages les plus récents.
   * Avec `before` : les `limit` messages immédiatement plus anciens que ce message.
   * Ordonnés de manière stable par (created_at, id).
   */
  findByConversation(
    conversationId: number,
    limit: number,
    before?: number,
  ): Promise<MessageEntity[]>;

  /** Dernier message d'une conversation, ou null si elle est vide. */
  findLastByConversation(conversationId: number): Promise<MessageEntity | null>;
}

export const MESSAGE_REPOSITORY_PORT = Symbol('IMessageRepository');
