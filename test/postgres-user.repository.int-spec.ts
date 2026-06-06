import 'reflect-metadata';
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PostgresUserRepository } from '../src/features/user/infrastructure/output/postgres-user.repository';
import { UserAccountOrmEntity } from '../src/features/user/infrastructure/output/orm/user-account.orm-entity';
import { AccountAdminAccessOrmEntity } from '../src/features/user/infrastructure/output/orm/account-admin-access.orm-entity';
import { UserEntity } from '../src/features/user/domain/entities/user.entity';
import { AccountStatus } from '../src/features/user/domain/entities/account-status.enum';
import { StudentClass } from '../src/features/user/domain/entities/student-class.enum';

/**
 * Test d'intégration : le PostgresUserRepository est exécuté contre un conteneur
 * Postgres ÉPHÉMÈRE démarré par testcontainers. Chaque run :
 *   1. démarre un postgres:18 jetable,
 *   2. applique les migrations Flyway (bdd/migrations/V*.sql) dans l'ordre,
 *      ce qui crée le schéma ET injecte le seed (V5/V6),
 *   3. exécute les tests,
 *   4. détruit le conteneur.
 *
 * Aucune base externe ni docker-compose n'est requis : seul un démon Docker
 * accessible suffit.
 *
 * Comptes de seed utilisés (cf. V5/V6) :
 *   - alice.martin@connectus.fr  → TEACHER, admin
 *   - clara.leroy@connectus.fr   → ALUMNI, non-admin
 *   - emma.bernard@connectus.fr  → STUDENT (M1)
 */
const MIGRATIONS_DIR = resolve(__dirname, '..', 'bdd', 'migrations');
const TEST_EMAIL_DOMAIN = '@itest.local';

const applyMigrations = async (dataSource: DataSource): Promise<void> => {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^V\d+__.*\.sql$/.test(f))
    .sort(
      (a, b) => Number(/^V(\d+)/.exec(a)![1]) - Number(/^V(\d+)/.exec(b)![1]),
    );

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    await dataSource.query(sql);
  }
};

describe('PostgresUserRepository (intégration, conteneur éphémère)', () => {
  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let repository: PostgresUserRepository;
  let dataSource: DataSource;

  const cleanupTestUsers = (): Promise<unknown> =>
    dataSource.query('DELETE FROM user_accounts WHERE email LIKE $1', [
      `%${TEST_EMAIL_DOMAIN}`,
    ]);

  const getIdByEmail = async (email: string): Promise<number> => {
    const rows: Array<{ id: string }> = await dataSource.query(
      'SELECT id FROM user_accounts WHERE email = $1',
      [email],
    );
    return Number(rows[0].id);
  };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').start();

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [UserAccountOrmEntity, AccountAdminAccessOrmEntity],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([
          UserAccountOrmEntity,
          AccountAdminAccessOrmEntity,
        ]),
      ],
      providers: [PostgresUserRepository],
    }).compile();

    repository = moduleRef.get(PostgresUserRepository);
    dataSource = moduleRef.get(DataSource);

    await applyMigrations(dataSource);
  }, 180_000);

  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await moduleRef?.close();
    await container?.stop();
  });

  describe('isAdmin', () => {
    it('retourne true pour un compte avec un accès admin actif (Alice)', async () => {
      const aliceId = await getIdByEmail('alice.martin@connectus.fr');
      expect(await repository.isAdmin(aliceId)).toBe(true);
    });

    it('retourne false pour un compte sans accès admin (Clara)', async () => {
      const claraId = await getIdByEmail('clara.leroy@connectus.fr');
      expect(await repository.isAdmin(claraId)).toBe(false);
    });

    it('retourne false pour un id inexistant', async () => {
      expect(await repository.isAdmin(999999)).toBe(false);
    });
  });

  describe('findById', () => {
    it("retourne l'entité mappée avec isAdmin=true (Alice)", async () => {
      const aliceId = await getIdByEmail('alice.martin@connectus.fr');
      const user = await repository.findById(aliceId);

      expect(user).not.toBeNull();
      expect(user!.firstName).toBe('Alice');
      expect(user!.lastName).toBe('Martin');
      expect(user!.email).toBe('alice.martin@connectus.fr');
      expect(user!.statusInSchool).toBe(AccountStatus.TEACHER);
      expect(user!.isAdmin).toBe(true);
    });

    it('mappe un étudiant avec sa classe (Emma)', async () => {
      const emmaId = await getIdByEmail('emma.bernard@connectus.fr');
      const user = await repository.findById(emmaId);

      expect(user!.statusInSchool).toBe(AccountStatus.STUDENT);
      expect(user!.studentClass).toBe(StudentClass.M1);
      expect(user!.isAdmin).toBe(false);
    });

    it('retourne null pour un id inexistant', async () => {
      expect(await repository.findById(999999)).toBeNull();
    });
  });

  describe('findByName', () => {
    it('retourne les utilisateurs correspondants', async () => {
      const result = await repository.findByName('Alice', 'Martin');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('alice.martin@connectus.fr');
    });

    it('est insensible à la casse (LOWER)', async () => {
      const result = await repository.findByName('alice', 'MARTIN');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('alice.martin@connectus.fr');
    });

    it('retourne un tableau vide si aucun résultat', async () => {
      const result = await repository.findByName('Zorro', 'Inconnu');
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('persiste un nouvel utilisateur non-admin et le retourne', async () => {
      const newUser = new UserEntity(
        'Test',
        'User',
        `teacher${TEST_EMAIL_DOMAIN}`,
        'hash',
        AccountStatus.TEACHER,
        false,
      );

      const created = await repository.create(newUser);

      expect(created.email).toBe(`teacher${TEST_EMAIL_DOMAIN}`);
      expect(created.isAdmin).toBe(false);

      // Vérifie la persistance réelle.
      const persisted = await repository.findByName('Test', 'User');
      expect(persisted).toHaveLength(1);

      const id = await getIdByEmail(`teacher${TEST_EMAIL_DOMAIN}`);
      expect(await repository.isAdmin(id)).toBe(false);
    });

    it("crée aussi une ligne d'accès admin si isAdmin=true", async () => {
      const newUser = new UserEntity(
        'Admin',
        'User',
        `admin${TEST_EMAIL_DOMAIN}`,
        'hash',
        AccountStatus.TEACHER,
        true,
      );

      const created = await repository.create(newUser);
      expect(created.isAdmin).toBe(true);

      const id = await getIdByEmail(`admin${TEST_EMAIL_DOMAIN}`);
      expect(await repository.isAdmin(id)).toBe(true);

      const rows = await dataSource.query(
        'SELECT account_id FROM account_admin_accesses WHERE account_id = $1',
        [id],
      );
      expect(rows).toHaveLength(1);
    });

    it('persiste un étudiant avec sa classe et son parcours', async () => {
      const newUser = new UserEntity(
        'Etu',
        'Diant',
        `student${TEST_EMAIL_DOMAIN}`,
        'hash',
        AccountStatus.STUDENT,
        false,
        undefined,
        undefined,
        undefined,
        'Computer Science',
        StudentClass.M2,
      );

      await repository.create(newUser);

      const id = await getIdByEmail(`student${TEST_EMAIL_DOMAIN}`);
      const found = await repository.findById(id);

      expect(found!.statusInSchool).toBe(AccountStatus.STUDENT);
      expect(found!.studentClass).toBe(StudentClass.M2);
      expect(found!.currentCourse).toBe('Computer Science');
    });
  });

  describe('delete', () => {
    it('supprime un utilisateur existant', async () => {
      await repository.create(
        new UserEntity(
          'Del',
          'Ete',
          `delete${TEST_EMAIL_DOMAIN}`,
          'hash',
          AccountStatus.ALUMNI,
          false,
        ),
      );
      const id = await getIdByEmail(`delete${TEST_EMAIL_DOMAIN}`);

      await repository.delete(id);

      expect(await repository.findById(id)).toBeNull();
    });

    it("supprime en cascade l'accès admin associé", async () => {
      await repository.create(
        new UserEntity(
          'DelAdmin',
          'Ete',
          `deladmin${TEST_EMAIL_DOMAIN}`,
          'hash',
          AccountStatus.TEACHER,
          true,
        ),
      );
      const id = await getIdByEmail(`deladmin${TEST_EMAIL_DOMAIN}`);

      await repository.delete(id);

      const rows = await dataSource.query(
        'SELECT account_id FROM account_admin_accesses WHERE account_id = $1',
        [id],
      );
      expect(rows).toHaveLength(0);
    });
  });
});
