import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { AccountAdminAccessOrmEntity } from './orm/account-admin-access.orm-entity';
import { UserAccountOrmEntity } from './orm/user-account.orm-entity';
import { PostgresUserRepository } from './postgres-user.repository';
import { AccountStatus } from '../../domain/entities/account-status.enum';
import { UserEntity } from '../../domain/entities/user.entity';

const makeOrmRow = (overrides: Partial<UserAccountOrmEntity> = {}): UserAccountOrmEntity =>
  Object.assign(new UserAccountOrmEntity(), {
    id: 1,
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@epsi.fr',
    passwordHash: 'hash',
    phoneNumber: null,
    photoUrl: null,
    rgpdPreferences: {},
    status: AccountStatus.TEACHER,
    currentCourse: null,
    studentClass: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

const makeAdminAccess = (overrides: Partial<AccountAdminAccessOrmEntity> = {}): AccountAdminAccessOrmEntity =>
  Object.assign(new AccountAdminAccessOrmEntity(), {
    accountId: 1,
    isActive: true,
    grantedAt: new Date('2024-01-01'),
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  });

describe('PostgresUserRepository (TI)', () => {
  let repo: PostgresUserRepository;
  let userRepo: jest.Mocked<any>;
  let adminRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    userRepo = {
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    adminRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PostgresUserRepository,
        { provide: getRepositoryToken(UserAccountOrmEntity), useValue: userRepo },
        { provide: getRepositoryToken(AccountAdminAccessOrmEntity), useValue: adminRepo },
      ],
    }).compile();

    repo = module.get(PostgresUserRepository);
  });

  describe('findById', () => {
    it("retourne null si l'utilisateur n'existe pas", async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });

    it('retourne une UserEntity mappée avec isAdmin', async () => {
      userRepo.findOneBy.mockResolvedValue(makeOrmRow());
      adminRepo.findOne.mockResolvedValue(makeAdminAccess());

      const result = await repo.findById(1);

      expect(result).not.toBeNull();
      expect(result!.isAdmin).toBe(true);
      expect(result!.email).toBe('jean@epsi.fr');
    });
  });

  describe('findByName', () => {
    it('retourne les entités correspondantes', async () => {
      const rows = [makeOrmRow({ id: 1 }), makeOrmRow({ id: 2, email: 'jean2@epsi.fr' })];
      userRepo.createQueryBuilder().getMany.mockResolvedValue(rows);
      adminRepo.findOne.mockResolvedValue(null);

      const result = await repo.findByName('Jean', 'Dupont');

      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it("insère l'utilisateur et retourne l'entité", async () => {
      const row = makeOrmRow();
      userRepo.create.mockReturnValue(row);
      userRepo.save.mockResolvedValue(row);
      adminRepo.findOne.mockResolvedValue(null);

      const user = new UserEntity(
        'Jean', 'Dupont', 'jean@epsi.fr', 'hash', AccountStatus.TEACHER, false,
      );

      const result = await repo.create(user);

      expect(userRepo.save).toHaveBeenCalled();
      expect(adminRepo.create).not.toHaveBeenCalled();
      expect(result.email).toBe('jean@epsi.fr');
    });

    it('insère aussi dans account_admin_accesses si isAdmin=true', async () => {
      const row = makeOrmRow();
      userRepo.create.mockReturnValue(row);
      userRepo.save.mockResolvedValue(row);
      adminRepo.create.mockReturnValue(makeAdminAccess());
      adminRepo.save.mockResolvedValue(makeAdminAccess());

      const user = new UserEntity(
        'Jean', 'Dupont', 'jean@epsi.fr', 'hash', AccountStatus.TEACHER, true,
      );

      await repo.create(user);

      expect(adminRepo.create).toHaveBeenCalled();
      expect(adminRepo.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('appelle userRepo.delete avec le bon id', async () => {
      userRepo.delete.mockResolvedValue({ affected: 1 });

      await repo.delete(5);

      expect(userRepo.delete).toHaveBeenCalledWith(5);
    });
  });

  describe('isAdmin', () => {
    it('retourne false si aucun accès trouvé', async () => {
      adminRepo.findOne.mockResolvedValue(null);

      expect(await repo.isAdmin(1)).toBe(false);
    });

    it("retourne true si l'accès est actif et non expiré", async () => {
      adminRepo.findOne.mockResolvedValue(makeAdminAccess({ expiresAt: null }));

      expect(await repo.isAdmin(1)).toBe(true);
    });

    it("retourne false si l'accès est expiré", async () => {
      adminRepo.findOne.mockResolvedValue(
        makeAdminAccess({ expiresAt: new Date('2000-01-01') }),
      );

      expect(await repo.isAdmin(1)).toBe(false);
    });

    it('passe le bon where clause (revokedAt IS NULL)', async () => {
      adminRepo.findOne.mockResolvedValue(null);

      await repo.isAdmin(42);

      expect(adminRepo.findOne).toHaveBeenCalledWith({
        where: { accountId: 42, revokedAt: IsNull() },
      });
    });
  });
});
