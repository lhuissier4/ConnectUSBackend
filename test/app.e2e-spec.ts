import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { applyMigrations } from './support/apply-migrations';

/**
 * Ce test charge l'AppModule complet, qui ouvre une connexion TypeORM. Pour
 * rester autonome (pas de base externe), on démarre un Postgres éphémère et on
 * pointe l'AppModule dessus via les variables d'environnement : @nestjs/config
 * ne réécrase pas une variable déjà présente dans process.env, donc celles-ci
 * ont priorité sur le fichier .env.
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let container: StartedPostgreSqlContainer;
  const savedEnv: Record<string, string | undefined> = {};

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').start();

    const overrides: Record<string, string> = {
      POSTGRES_HOST: container.getHost(),
      POSTGRES_PORT: String(container.getPort()),
      POSTGRES_USER: container.getUsername(),
      POSTGRES_PASSWORD: container.getPassword(),
      POSTGRES_DB: container.getDatabase(),
    };
    for (const [key, value] of Object.entries(overrides)) {
      savedEnv[key] = process.env[key];
      process.env[key] = value;
    }

    // Le schéma n'est pas créé par TypeORM (synchronize: false). On applique les
    // migrations Flyway au conteneur pour que l'AppModule boote contre un vrai
    // schéma — la reprise des appels au démarrage (CallRecoveryService) interroge
    // la table `calls` dès l'initialisation.
    const migrationDataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    });
    await migrationDataSource.initialize();
    await applyMigrations(migrationDataSource);
    await migrationDataSource.destroy();
  }, 180_000);

  afterAll(async () => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    await container?.stop();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
