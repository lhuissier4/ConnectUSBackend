import { ConversationEntity } from '../../domain/entities/conversation.entity';

/**
 * Port de sortie : contrat de persistance des conversations.
 * Les use-cases en dépendent ; l'infrastructure le réalise
 * (cf. PostgresConversationRepository). Échange des ConversationEntity,
 * jamais des entités ORM.
 */
export interface IConversationRepository {
  /** Recherche une conversation par sa paire ordonnée (participantA < participantB). */
  findByParticipants(
    participantAId: number,
    participantBId: number,
  ): Promise<ConversationEntity | null>;

  findById(id: number): Promise<ConversationEntity | null>;

  /** Crée une conversation à partir d'une paire ordonnée. */
  create(
    participantAId: number,
    participantBId: number,
  ): Promise<ConversationEntity>;

  /** Conversations dont l'utilisateur est participant, triées par activité récente. */
  listForUser(userId: number): Promise<ConversationEntity[]>;
}

export const CONVERSATION_REPOSITORY_PORT = Symbol('IConversationRepository');
