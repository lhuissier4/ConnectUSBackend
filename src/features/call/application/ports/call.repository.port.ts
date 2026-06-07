import { CallEntity } from '../../domain/entities/call.entity';
import { CallType } from '../../domain/enums/call-type.enum';

/** Données nécessaires à la création d'un appel (statut RINGING par défaut). */
export interface CreateCallData {
  conversationId: number;
  callerId: number;
  calleeId: number;
  type: CallType;
}

/**
 * Port de sortie : contrat de persistance des appels.
 * Les use-cases en dépendent ; l'infrastructure le réalise
 * (cf. PostgresCallRepository). Échange des CallEntity, jamais des entités ORM.
 */
export interface ICallRepository {
  create(data: CreateCallData): Promise<CallEntity>;

  findById(id: number): Promise<CallEntity | null>;

  /** Appel en cours (RINGING / ACTIVE / MISSED) d'une conversation, s'il existe. */
  findActiveByConversation(conversationId: number): Promise<CallEntity | null>;

  /** Historique des appels d'une conversation, du plus récent au plus ancien. */
  findByConversation(
    conversationId: number,
    limit: number,
    before?: number,
  ): Promise<CallEntity[]>;

  update(call: CallEntity): Promise<CallEntity>;

  /** Appels restés en cours (RINGING / ACTIVE / MISSED), pour la reprise au démarrage. */
  findStale(): Promise<CallEntity[]>;
}

export const CALL_REPOSITORY_PORT = Symbol('ICallRepository');
