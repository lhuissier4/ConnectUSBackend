import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { CallEntity } from '../../domain/entities/call.entity';
import { CallStatus } from '../../domain/enums/call-status.enum';
import {
  CreateCallData,
  ICallRepository,
} from '../../application/ports/call.repository.port';
import { CallOrmEntity } from './orm/call.orm-entity';

/** Statuts considérés comme « appel en cours » pour une conversation. */
const ACTIVE_STATUSES = [
  CallStatus.RINGING,
  CallStatus.ACTIVE,
  CallStatus.MISSED,
];

@Injectable()
export class PostgresCallRepository implements ICallRepository {
  constructor(
    @InjectRepository(CallOrmEntity)
    private readonly callRepo: Repository<CallOrmEntity>,
  ) {}

  async create(data: CreateCallData): Promise<CallEntity> {
    const row = this.callRepo.create({
      conversationId: data.conversationId,
      callerId: data.callerId,
      calleeId: data.calleeId,
      type: data.type,
      status: CallStatus.RINGING,
      startedAt: new Date(),
    });
    const saved = await this.callRepo.save(row);
    return this.toEntity(saved);
  }

  async findById(id: number): Promise<CallEntity | null> {
    const row = await this.callRepo.findOneBy({ id });
    return row ? this.toEntity(row) : null;
  }

  async findActiveByConversation(
    conversationId: number,
  ): Promise<CallEntity | null> {
    const row = await this.callRepo.findOne({
      where: { conversationId, status: In(ACTIVE_STATUSES) },
      order: { createdAt: 'DESC' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByConversation(
    conversationId: number,
    limit: number,
    before?: number,
  ): Promise<CallEntity[]> {
    const rows = await this.callRepo.find({
      where: {
        conversationId,
        ...(before !== undefined ? { id: LessThan(before) } : {}),
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: limit,
    });
    return rows.map((row) => this.toEntity(row));
  }

  async update(call: CallEntity): Promise<CallEntity> {
    await this.callRepo.update(call.id, {
      status: call.status,
      answeredAt: call.answeredAt,
      endedAt: call.endedAt,
      endReason: call.endReason,
    });
    const row = await this.callRepo.findOneByOrFail({ id: call.id });
    return this.toEntity(row);
  }

  async findStale(): Promise<CallEntity[]> {
    const rows = await this.callRepo.find({
      where: { status: In(ACTIVE_STATUSES) },
    });
    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: CallOrmEntity): CallEntity {
    return new CallEntity(
      Number(row.id),
      Number(row.conversationId),
      Number(row.callerId),
      Number(row.calleeId),
      row.status,
      row.type,
      row.startedAt,
      row.answeredAt,
      row.endedAt,
      row.endReason,
      row.createdAt,
      row.updatedAt,
    );
  }
}
