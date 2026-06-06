import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('messages')
export class MessageOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId: number;

  @Column({ name: 'author_id', type: 'bigint' })
  authorId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'response_to_message_id', type: 'bigint', nullable: true })
  responseToMessageId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
