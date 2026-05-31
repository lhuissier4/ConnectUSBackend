import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('account_admin_accesses')
export class AccountAdminAccessOrmEntity {
  @PrimaryColumn({ name: 'account_id', type: 'bigint' })
  accountId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'granted_at', type: 'timestamp' })
  grantedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;
}
