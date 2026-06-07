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
import { PostgresConversationRepository } from '../src/features/message/infrastructure/output/postgres-conversation.repository';
import { PostgresMessageRepository } from '../src/features/message/infrastructure/output/postgres-message.repository';
import { ConversationOrmEntity } from '../src/features/message/infrastructure/output/orm/conversation.orm-entity';
import { MessageOrmEntity } from '../src/features/message/infrastructure/output/orm/message.orm-entity';

/**
 * Test d'intégration : les repositories Postgres de la feature message exécutés
 * contre un conteneur Postgres éphémère (testcontainers). Les migrations Flyway
 * (V1..V8) créent le schéma et injectent le seed utilisateurs (V5), réutilisé ici
 * comme participants des conversations.
 */
const MIGRATIONS_DIR = resolve(__dirname, '..', 'bdd', 'migrations');

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

describe('Postgres message repositories (intégration, conteneur éphémère)', () => {
  let container: StartedPostgreSqlContainer;
  let moduleRef: TestingModule;
  let conversationRepo: PostgresConversationRepository;
  let messageRepo: PostgresMessageRepository;
  let dataSource: DataSource;

  let alice: number;
  let clara: number;
  let emma: number;

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
          entities: [ConversationOrmEntity, MessageOrmEntity],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([ConversationOrmEntity, MessageOrmEntity]),
      ],
      providers: [PostgresConversationRepository, PostgresMessageRepository],
    }).compile();

    conversationRepo = moduleRef.get(PostgresConversationRepository);
    messageRepo = moduleRef.get(PostgresMessageRepository);
    dataSource = moduleRef.get(DataSource);

    await applyMigrations(dataSource);

    alice = await getIdByEmail('alice.martin@connectus.fr');
    clara = await getIdByEmail('clara.leroy@connectus.fr');
    emma = await getIdByEmail('emma.bernard@connectus.fr');
  }, 180_000);

  afterEach(async () => {
    // Cascade : supprime aussi les messages.
    await dataSource.query('DELETE FROM conversations');
  });

  afterAll(async () => {
    await moduleRef?.close();
    await container?.stop();
  });

  describe('conversations', () => {
    it('crée une conversation et la retrouve par paire ordonnée', async () => {
      const [a, b] = alice < clara ? [alice, clara] : [clara, alice];
      const created = await conversationRepo.create(a, b);

      expect(created.id).toBeGreaterThan(0);
      expect(created.participantAId).toBe(a);
      expect(created.participantBId).toBe(b);

      const found = await conversationRepo.findByParticipants(a, b);
      expect(found?.id).toBe(created.id);
    });

    it('listForUser trie par activité récente (dernier message en premier)', async () => {
      const [a1, b1] = alice < clara ? [alice, clara] : [clara, alice];
      const [a2, b2] = alice < emma ? [alice, emma] : [emma, alice];

      const convClara = await conversationRepo.create(a1, b1);
      const convEmma = await conversationRepo.create(a2, b2);

      // Message le plus récent dans la conversation avec Emma.
      await messageRepo.create({
        conversationId: convClara.id,
        authorId: alice,
        content: 'ancien',
      });
      await messageRepo.create({
        conversationId: convEmma.id,
        authorId: alice,
        content: 'recent',
      });

      const list = await conversationRepo.listForUser(alice);
      expect(list.map((c) => c.id)).toEqual([convEmma.id, convClara.id]);
    });
  });

  describe('messages', () => {
    it('persiste un message et renvoie le dernier', async () => {
      const [a, b] = alice < clara ? [alice, clara] : [clara, alice];
      const conv = await conversationRepo.create(a, b);

      await messageRepo.create({
        conversationId: conv.id,
        authorId: alice,
        content: 'premier',
      });
      const last = await messageRepo.create({
        conversationId: conv.id,
        authorId: clara,
        content: 'dernier',
      });

      const found = await messageRepo.findLastByConversation(conv.id);
      expect(found?.id).toBe(last.id);
      expect(found?.content).toBe('dernier');
    });

    it('pagine par curseur : derniers messages puis remontée du fil', async () => {
      const [a, b] = alice < clara ? [alice, clara] : [clara, alice];
      const conv = await conversationRepo.create(a, b);

      for (let i = 1; i <= 5; i++) {
        await messageRepo.create({
          conversationId: conv.id,
          authorId: alice,
          content: `msg ${i}`,
        });
      }

      // Page initiale : 3 derniers, en ordre chronologique.
      const lastThree = await messageRepo.findByConversation(conv.id, 3);
      expect(lastThree.map((m) => m.content)).toEqual([
        'msg 3',
        'msg 4',
        'msg 5',
      ]);

      // Remontée du fil : 3 messages plus anciens que "msg 3".
      const older = await messageRepo.findByConversation(
        conv.id,
        3,
        lastThree[0].id,
      );
      expect(older.map((m) => m.content)).toEqual(['msg 1', 'msg 2']);
    });

    it('findLastByConversation renvoie null pour une conversation vide', async () => {
      const [a, b] = alice < clara ? [alice, clara] : [clara, alice];
      const conv = await conversationRepo.create(a, b);

      expect(await messageRepo.findLastByConversation(conv.id)).toBeNull();
    });
  });
});
