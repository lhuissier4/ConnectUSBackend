import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { IConversationRepository } from '../../application/ports/conversation.repository.port';
import { ConversationOrmEntity } from './orm/conversation.orm-entity';

@Injectable()
export class PostgresConversationRepository implements IConversationRepository {
  constructor(
    @InjectRepository(ConversationOrmEntity)
    private readonly conversationRepo: Repository<ConversationOrmEntity>,
  ) {}

  async findByParticipants(
    participantAId: number,
    participantBId: number,
  ): Promise<ConversationEntity | null> {
    const row = await this.conversationRepo.findOneBy({
      participantAId,
      participantBId,
    });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: number): Promise<ConversationEntity | null> {
    const row = await this.conversationRepo.findOneBy({ id });
    return row ? this.toEntity(row) : null;
  }

  async create(
    participantAId: number,
    participantBId: number,
  ): Promise<ConversationEntity> {
    const row = this.conversationRepo.create({
      participantAId,
      participantBId,
    });
    const saved = await this.conversationRepo.save(row);
    return this.toEntity(saved);
  }

  async listForUser(userId: number): Promise<ConversationEntity[]> {
    // Conversations dont l'utilisateur est participant (a OU b), triées par
    // activité la plus récente : dernier message, à défaut date de création.
    const rows = await this.conversationRepo
      .createQueryBuilder('c')
      .leftJoin('messages', 'm', 'm.conversation_id = c.id')
      .where('c.participant_a_id = :userId OR c.participant_b_id = :userId', {
        userId,
      })
      .groupBy('c.id')
      .orderBy('COALESCE(MAX(m.created_at), c.created_at)', 'DESC')
      .getMany();

    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: ConversationOrmEntity): ConversationEntity {
    return new ConversationEntity(
      Number(row.id),
      Number(row.participantAId),
      Number(row.participantBId),
      row.createdAt,
      row.updatedAt,
    );
  }
}
