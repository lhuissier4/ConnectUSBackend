import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountStatus, StudentClass } from '../../domain/entities/user.entity';

@Entity('user_accounts')
export class UserAccountOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 30, nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'rgpd_preferences', type: 'jsonb', default: '{}' })
  rgpdPreferences: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    enumName: 'account_status',
  })
  status: AccountStatus;

  @Column({
    name: 'current_course',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  currentCourse: string | null;

  @Column({
    name: 'class',
    type: 'enum',
    enum: StudentClass,
    enumName: 'student_class',
    nullable: true,
  })
  studentClass: StudentClass | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
