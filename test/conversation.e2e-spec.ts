import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConversationController } from '../src/features/message/infrastructure/input/conversation.controller';
import { ChatService } from '../src/features/message/infrastructure/input/chat.service';
import { CreateConversationUseCase } from '../src/features/message/application/use-cases/create-conversation.usecase';
import { ListConversationsUseCase } from '../src/features/message/application/use-cases/list-conversations.usecase';
import { GetConversationMessagesUseCase } from '../src/features/message/application/use-cases/get-conversation-messages.usecase';
import { SendMessageUseCase } from '../src/features/message/application/use-cases/send-message.usecase';
import { CONVERSATION_REPOSITORY_PORT } from '../src/features/message/application/ports/conversation.repository.port';
import { MESSAGE_REPOSITORY_PORT } from '../src/features/message/application/ports/message.repository.port';
import { USER_LOOKUP_PORT } from '../src/features/message/application/ports/user-lookup.port';
import { ConversationEntity } from '../src/features/message/domain/entities/conversation.entity';
import { MessageEntity } from '../src/features/message/domain/entities/message.entity';

describe('ConversationController (e2e, ports mockés)', () => {
  let app: INestApplication<App>;
  let conversationRepo: jest.Mocked<any>;
  let messageRepo: jest.Mocked<any>;
  let userLookup: jest.Mocked<any>;

  beforeEach(async () => {
    conversationRepo = {
      findByParticipants: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      listForUser: jest.fn(),
    };
    messageRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByConversation: jest.fn(),
      findLastByConversation: jest.fn(),
    };
    userLookup = { exists: jest.fn().mockResolvedValue(true) };

    const moduleFixture = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      controllers: [ConversationController],
      providers: [
        ChatService,
        CreateConversationUseCase,
        ListConversationsUseCase,
        GetConversationMessagesUseCase,
        SendMessageUseCase,
        { provide: CONVERSATION_REPOSITORY_PORT, useValue: conversationRepo },
        { provide: MESSAGE_REPOSITORY_PORT, useValue: messageRepo },
        { provide: USER_LOOKUP_PORT, useValue: userLookup },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── POST /conversations ──────────────────────────────────────────────────

  describe('POST /conversations', () => {
    it('201 - crée une nouvelle conversation', async () => {
      conversationRepo.findByParticipants.mockResolvedValue(null);
      conversationRepo.create.mockResolvedValue(
        new ConversationEntity(1, 3, 8, new Date(), new Date()),
      );

      await request(app.getHttpServer())
        .post('/conversations')
        .set('x-requesting-user-id', '3')
        .send({ targetUserId: 8 })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: 1,
            otherParticipantId: 8,
            lastMessage: null,
          });
        });
    });

    it('200 - renvoie la conversation existante (idempotence)', async () => {
      conversationRepo.findByParticipants.mockResolvedValue(
        new ConversationEntity(1, 3, 8, new Date(), new Date()),
      );

      await request(app.getHttpServer())
        .post('/conversations')
        .set('x-requesting-user-id', '8')
        .send({ targetUserId: 3 })
        .expect(200)
        .expect((res) => {
          expect(res.body.otherParticipantId).toBe(3);
        });
    });

    it('400 - conversation avec soi-même', async () => {
      await request(app.getHttpServer())
        .post('/conversations')
        .set('x-requesting-user-id', '7')
        .send({ targetUserId: 7 })
        .expect(400);
    });

    it('404 - utilisateur cible inexistant', async () => {
      userLookup.exists.mockImplementation((id: number) =>
        Promise.resolve(id !== 99),
      );

      await request(app.getHttpServer())
        .post('/conversations')
        .set('x-requesting-user-id', '3')
        .send({ targetUserId: 99 })
        .expect(404);
    });

    it('400 - payload invalide (targetUserId manquant)', async () => {
      await request(app.getHttpServer())
        .post('/conversations')
        .set('x-requesting-user-id', '3')
        .send({})
        .expect(400);
    });
  });

  // ── GET /conversations ───────────────────────────────────────────────────

  describe('GET /conversations', () => {
    it("200 - liste enrichie des conversations de l'appelant", async () => {
      conversationRepo.listForUser.mockResolvedValue([
        new ConversationEntity(1, 3, 8, new Date(), new Date()),
      ]);
      messageRepo.findLastByConversation.mockResolvedValue(
        new MessageEntity(10, 1, 8, 'à demain', new Date(), new Date()),
      );

      await request(app.getHttpServer())
        .get('/conversations')
        .set('x-requesting-user-id', '3')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].otherParticipantId).toBe(8);
          expect(res.body[0].lastMessage.content).toBe('à demain');
        });
    });
  });

  // ── GET /conversations/:id/messages ──────────────────────────────────────

  describe('GET /conversations/:id/messages', () => {
    it('200 - renvoie les messages pour un participant', async () => {
      conversationRepo.findById.mockResolvedValue(
        new ConversationEntity(1, 3, 8, new Date(), new Date()),
      );
      messageRepo.findByConversation.mockResolvedValue([
        new MessageEntity(10, 1, 3, 'salut', new Date(), new Date()),
      ]);

      await request(app.getHttpServer())
        .get('/conversations/1/messages')
        .set('x-requesting-user-id', '3')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].content).toBe('salut');
        });
    });

    it('403 - non-participant', async () => {
      conversationRepo.findById.mockResolvedValue(
        new ConversationEntity(1, 3, 8, new Date(), new Date()),
      );

      await request(app.getHttpServer())
        .get('/conversations/1/messages')
        .set('x-requesting-user-id', '99')
        .expect(403);
    });

    it('404 - conversation inexistante', async () => {
      conversationRepo.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/conversations/999/messages')
        .set('x-requesting-user-id', '3')
        .expect(404);
    });
  });

  // ── POST /conversations/:id/messages ─────────────────────────────────────

  describe('POST /conversations/:id/messages', () => {
    it('201 - envoie un message', async () => {
      conversationRepo.findById.mockResolvedValue(
        new ConversationEntity(1, 3, 8, new Date(), new Date()),
      );
      messageRepo.create.mockResolvedValue(
        new MessageEntity(10, 1, 3, 'salut', new Date(), new Date()),
      );

      await request(app.getHttpServer())
        .post('/conversations/1/messages')
        .set('x-requesting-user-id', '3')
        .send({ content: 'salut' })
        .expect(201)
        .expect((res) => {
          expect(res.body.content).toBe('salut');
          expect(res.body.authorId).toBe(3);
        });
    });

    it('400 - contenu vide', async () => {
      await request(app.getHttpServer())
        .post('/conversations/1/messages')
        .set('x-requesting-user-id', '3')
        .send({ content: '' })
        .expect(400);
    });

    it('403 - non-participant', async () => {
      conversationRepo.findById.mockResolvedValue(
        new ConversationEntity(1, 3, 8, new Date(), new Date()),
      );

      await request(app.getHttpServer())
        .post('/conversations/1/messages')
        .set('x-requesting-user-id', '99')
        .send({ content: 'salut' })
        .expect(403);
    });
  });
});
