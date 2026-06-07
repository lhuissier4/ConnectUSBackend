import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ConversationParticipants,
  IConversationLookup,
} from '../../application/ports/conversation-lookup.port';

/**
 * Réalisation du port IConversationLookup : interroge directement la table
 * conversations, sans coupler la feature call au domaine/repository de la
 * feature message.
 */
@Injectable()
export class ConversationLookupAdapter implements IConversationLookup {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    conversationId: number,
  ): Promise<ConversationParticipants | null> {
    const rows: Array<{
      id: string | number;
      participant_a_id: string | number;
      participant_b_id: string | number;
    }> = await this.dataSource.query(
      'SELECT id, participant_a_id, participant_b_id FROM conversations WHERE id = $1',
      [conversationId],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      id: Number(row.id),
      participantAId: Number(row.participant_a_id),
      participantBId: Number(row.participant_b_id),
    };
  }

  async hasParticipant(
    conversationId: number,
    userId: number,
  ): Promise<boolean> {
    const rows: Array<{ exists: boolean }> = await this.dataSource.query(
      `SELECT EXISTS(
         SELECT 1 FROM conversations
         WHERE id = $1 AND (participant_a_id = $2 OR participant_b_id = $2)
       ) AS exists`,
      [conversationId, userId],
    );
    return rows[0]?.exists === true;
  }
}
