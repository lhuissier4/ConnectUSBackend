import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '../../domain/entities/message.entity';
import { IMessageRepository } from '../../application/ports/message.repository.port';
import { MessageOrmEntity } from './orm/message.orm-entity';

@Injectable()
export class PostgresMessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(MessageOrmEntity)
    private readonly messageRepo: Repository<MessageOrmEntity>,
  ) {}

  async create(message: {
    conversationId: number;
    authorId: number;
    content: string;
    responseToMessageId?: number;
  }): Promise<MessageEntity> {
    const row = this.messageRepo.create({
      conversationId: message.conversationId,
      authorId: message.authorId,
      content: message.content,
      responseToMessageId: message.responseToMessageId ?? null,
    });
    const saved = await this.messageRepo.save(row);
    return this.toEntity(saved);
  }

  async findById(id: number): Promise<MessageEntity | null> {
    const row = await this.messageRepo.findOneBy({ id });
    return row ? this.toEntity(row) : null;
  }

  async findByConversation(
    conversationId: number,
    limit: number,
    before?: number,
  ): Promise<MessageEntity[]> {
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversation_id = :conversationId', { conversationId })
      .orderBy('m.created_at', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .limit(limit);

    if (before !== undefined) {
      qb.andWhere('m.id < :before', { before });
    }

    const rows = await qb.getMany();
    // Récupérés du plus récent au plus ancien ; renvoyés en ordre chronologique.
    return rows.reverse().map((row) => this.toEntity(row));
  }

  async findLastByConversation(
    conversationId: number,
  ): Promise<MessageEntity | null> {
    const row = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversation_id = :conversationId', { conversationId })
      .orderBy('m.created_at', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .limit(1)
      .getOne();

    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: MessageOrmEntity): MessageEntity {
    return new MessageEntity(
      Number(row.id),
      Number(row.conversationId),
      Number(row.authorId),
      row.content,
      row.createdAt,
      row.updatedAt,
      row.responseToMessageId != null
        ? Number(row.responseToMessageId)
        : undefined,
    );
  }
}
