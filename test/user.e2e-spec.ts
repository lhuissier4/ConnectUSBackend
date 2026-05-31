import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AccountStatus, UserEntity } from '../src/features/user/domain/entities/user.entity';
import { USER_REPOSITORY_PORT } from '../src/features/user/domain/ports/output/user.repository.port';
import { CreateUserUseCase } from '../src/features/user/domain/use-cases/create-user.usecase';
import { DeleteUserUseCase } from '../src/features/user/domain/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from '../src/features/user/domain/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from '../src/features/user/domain/use-cases/get-user-by-name.usecase';
import { UserController } from '../src/features/user/input_adapters/user.controller.js';
import { UserService } from '../src/features/user/input_adapters/user.service';

const makeUserEntity = (overrides: Partial<{ id: number; isAdmin: boolean }> = {}): UserEntity =>
  new UserEntity(
    overrides.id ?? 1,
    'Jean', 'Dupont', 'jean@epsi.fr', 'hash',
    AccountStatus.TEACHER,
    overrides.isAdmin ?? false,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

describe('UserController (TA)', () => {
  let app: INestApplication<App>;
  let mockRepository: jest.Mocked<any>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      isAdmin: jest.fn(),
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        GetUserByIdUseCase,
        GetUserByNameUseCase,
        CreateUserUseCase,
        DeleteUserUseCase,
        { provide: USER_REPOSITORY_PORT, useValue: mockRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── GET /users/search ──────────────────────────────────────────────────────

  describe('GET /users/search', () => {
    it('200 - retourne la liste des utilisateurs trouvés', async () => {
      mockRepository.findByName.mockResolvedValue([makeUserEntity()]);

      await request(app.getHttpServer())
        .get('/users/search?firstName=Jean&lastName=Dupont')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].email).toBe('jean@epsi.fr');
        });
    });

    it('404 - aucun utilisateur trouvé', async () => {
      mockRepository.findByName.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/users/search?firstName=Inconnu&lastName=Inconnu')
        .expect(404);
    });
  });

  // ── GET /users/:id ─────────────────────────────────────────────────────────

  describe('GET /users/:id', () => {
    it("200 - retourne l'utilisateur", async () => {
      mockRepository.findById.mockResolvedValue(makeUserEntity({ id: 1 }));

      await request(app.getHttpServer())
        .get('/users/1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(1);
        });
    });

    it('404 - utilisateur inexistant', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/users/999').expect(404);
    });

    it('400 - id non numérique', async () => {
      await request(app.getHttpServer()).get('/users/abc').expect(400);
    });
  });

  // ── POST /users ────────────────────────────────────────────────────────────

  describe('POST /users', () => {
    const validPayload = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@epsi.fr',
      passwordHash: 'hashed',
      status: AccountStatus.TEACHER,
      isAdmin: false,
    };

    it("201 - crée l'utilisateur", async () => {
      mockRepository.isAdmin.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(makeUserEntity());

      await request(app.getHttpServer())
        .post('/users')
        .set('x-requesting-user-id', '1')
        .send(validPayload)
        .expect(201);
    });

    it('400 - email invalide', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('x-requesting-user-id', '1')
        .send({ ...validPayload, email: 'pas-un-email' })
        .expect(400);
    });

    it('400 - STUDENT sans studentClass', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('x-requesting-user-id', '1')
        .send({ ...validPayload, status: AccountStatus.STUDENT })
        .expect(400);
    });

    it('400 - champ inconnu (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('x-requesting-user-id', '1')
        .send({ ...validPayload, champInconnu: 'valeur' })
        .expect(400);
    });

    it('201 - crée un admin si le demandeur est admin', async () => {
      mockRepository.isAdmin.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(makeUserEntity({ isAdmin: true }));

      await request(app.getHttpServer())
        .post('/users')
        .set('x-requesting-user-id', '1')
        .send({ ...validPayload, isAdmin: true })
        .expect(201);
    });

    it('403 - tentative de créer un admin par un non-admin', async () => {
      mockRepository.isAdmin.mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/users')
        .set('x-requesting-user-id', '99')
        .send({ ...validPayload, isAdmin: true })
        .expect(403);
    });
  });

  // ── DELETE /users/:id ──────────────────────────────────────────────────────

  describe('DELETE /users/:id', () => {
    it("200 - supprime l'utilisateur", async () => {
      mockRepository.isAdmin.mockResolvedValue(true);
      mockRepository.findById.mockResolvedValue(makeUserEntity({ id: 5 }));
      mockRepository.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/users/5')
        .set('x-requesting-user-id', '1')
        .expect(200);
    });

    it('403 - demandeur non admin', async () => {
      mockRepository.isAdmin.mockResolvedValue(false);

      await request(app.getHttpServer())
        .delete('/users/5')
        .set('x-requesting-user-id', '99')
        .expect(403);
    });

    it('404 - utilisateur cible inexistant', async () => {
      mockRepository.isAdmin.mockResolvedValue(true);
      mockRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/users/999')
        .set('x-requesting-user-id', '1')
        .expect(404);
    });
  });
});
