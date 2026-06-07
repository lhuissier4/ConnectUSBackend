import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserCardDto } from '../../application/dto/user-card.dto';
import { IUserRepository } from '../../application/ports/user.repository.port';
import { AccountAdminAccessOrmEntity } from './orm/account-admin-access.orm-entity';
import { UserAccountOrmEntity } from './orm/user-account.orm-entity';

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserAccountOrmEntity)
    private readonly userRepo: Repository<UserAccountOrmEntity>,
    @InjectRepository(AccountAdminAccessOrmEntity)
    private readonly adminRepo: Repository<AccountAdminAccessOrmEntity>,
  ) {}

  async findById(id: number): Promise<UserEntity | null> {
    const row = await this.userRepo.findOneBy({ id });
    if (!row) return null;
    const isAdmin = await this.isAdmin(id);
    return this.toEntity(row, isAdmin);
  }

  async findCardById(id: number): Promise<UserCardDto | null> {
    const row = await this.userRepo.findOneBy({ id });
    if (!row) return null;
    return new UserCardDto(Number(row.id), row.firstName, row.lastName);
  }

  async findByName(firstName: string, lastName: string): Promise<UserEntity[]> {
    const rows = await this.userRepo
      .createQueryBuilder('u')
      .where('LOWER(u.firstName) = LOWER(:firstName)', { firstName })
      .andWhere('LOWER(u.lastName) = LOWER(:lastName)', { lastName })
      .getMany();

    return Promise.all(
      rows.map(async (row) => {
        const isAdmin = await this.isAdmin(Number(row.id));
        return this.toEntity(row, isAdmin);
      }),
    );
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const newUser = this.userRepo.create({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      passwordHash: user.passwordHash,
      status: user.statusInSchool,
      phoneNumber: user.phoneNumber ?? null,
      photoUrl: user.photoUrl ?? null,
      rgpdPreferences: user.rgpdPreferences ?? {},
      currentCourse: user.currentCourse ?? null,
      studentClass: user.studentClass ?? null,
    });

    const saved = await this.userRepo.save(newUser);

    if (user.isAdmin) {
      const adminAccess = this.adminRepo.create({
        accountId: Number(saved.id),
        isActive: true,
        grantedAt: new Date(),
        expiresAt: null,
        revokedAt: null,
      });
      await this.adminRepo.save(adminAccess);
    }

    return this.toEntity(saved, user.isAdmin);
  }

  async delete(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  async isAdmin(userId: number): Promise<boolean> {
    const access = await this.adminRepo.findOne({
      where: {
        accountId: userId,
        revokedAt: IsNull(),
      },
    });

    if (!access) return false;
    if (access.expiresAt && access.expiresAt <= new Date()) return false;
    return true;
  }

  private toEntity(row: UserAccountOrmEntity, isAdmin: boolean): UserEntity {
    return new UserEntity(
      row.firstName,
      row.lastName,
      row.email,
      row.passwordHash,
      row.status,
      isAdmin,
      row.phoneNumber ?? undefined,
      row.photoUrl ?? undefined,
      row.rgpdPreferences ?? undefined,
      row.currentCourse ?? undefined,
      row.studentClass ?? undefined,
    );
  }
}
