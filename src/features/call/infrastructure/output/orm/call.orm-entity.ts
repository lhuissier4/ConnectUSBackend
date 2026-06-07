import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CallStatus } from '../../../domain/enums/call-status.enum';
import { CallType } from '../../../domain/enums/call-type.enum';
import { EndReason } from '../../../domain/enums/end-reason.enum';

@Entity('calls')
export class CallOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId: number;

  @Column({ name: 'caller_id', type: 'bigint' })
  callerId: number;

  @Column({ name: 'callee_id', type: 'bigint' })
  calleeId: number;

  @Column({ type: 'enum', enum: CallStatus })
  status: CallStatus;

  @Column({ type: 'enum', enum: CallType })
  type: CallType;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({
    name: 'end_reason',
    type: 'enum',
    enum: EndReason,
    nullable: true,
  })
  endReason: EndReason | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
