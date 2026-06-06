import { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { ChatGateway } from '../src/features/message/infrastructure/input/chat.gateway';
import { SendMessageUseCase } from '../src/features/message/application/use-cases/send-message.usecase';
import { CONVERSATION_REPOSITORY_PORT } from '../src/features/message/application/ports/conversation.repository.port';
import { MESSAGE_REPOSITORY_PORT } from '../src/features/message/application/ports/message.repository.port';
import { ConversationEntity } from '../src/features/message/domain/entities/conversation.entity';
import { MessageEntity } from '../src/features/message/domain/entities/message.entity';

/**
 * Vérifie la diffusion temps réel : un message envoyé via l'event WS `send`
 * (qui passe par le même SendMessageUseCase que le REST) est diffusé en
 * `message:new` à l'autre participant auto-rejoint à la room de la conversation.
 */
describe('ChatGateway (e2e, diffusion temps réel)', () => {
  let app: INestApplication;
  let url: string;

  const conversation = new ConversationEntity(42, 3, 8, new Date(), new Date());
  const conversationRepo = {
    findByParticipants: jest.fn(),
    findById: jest.fn().mockResolvedValue(conversation),
    create: jest.fn(),
    listForUser: jest.fn().mockResolvedValue([conversation]),
  };
  const messageRepo = {
    create: jest
      .fn()
      .mockResolvedValue(
        new MessageEntity(100, 42, 3, 'salut', new Date(), new Date()),
      ),
    findById: jest.fn(),
    findByConversation: jest.fn(),
    findLastByConversation: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        ChatGateway,
        SendMessageUseCase,
        { provide: CONVERSATION_REPOSITORY_PORT, useValue: conversationRepo },
        { provide: MESSAGE_REPOSITORY_PORT, useValue: messageRepo },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    const address = app.getHttpServer().address() as AddressInfo;
    url = `http://localhost:${address.port}/chat`;
  });

  afterAll(async () => {
    await app.close();
  });

  const connect = (userId: number): Promise<Socket> =>
    new Promise((resolve, reject) => {
      const socket = io(url, { auth: { userId }, transports: ['websocket'] });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });

  it('diffuse message:new au participant connecté après un event send', async () => {
    const alice = await connect(3);
    const bob = await connect(8);

    try {
      const received = new Promise<{ id: number; content: string }>((resolve) =>
        bob.on('message:new', resolve),
      );

      alice.emit('send', { conversationId: 42, content: 'salut' });

      const message = await received;
      expect(message.id).toBe(100);
      expect(message.content).toBe('salut');
    } finally {
      alice.disconnect();
      bob.disconnect();
    }
  });
});
