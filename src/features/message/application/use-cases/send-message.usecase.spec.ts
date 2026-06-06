import 'reflect-metadata';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { MessageEntity } from '../../domain/entities/message.entity';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { InvalidMessageException } from '../../domain/exceptions/invalid-message.exception';
import { NotAParticipantException } from '../../domain/exceptions/not-a-participant.exception';
import { IConversationRepository } from '../ports/conversation.repository.port';
import { IMessageRepository } from '../ports/message.repository.port';
import { MESSAGE_CREATED_EVENT } from '../events/message-created.event';
import { SendMessageUseCase } from './send-message.usecase';

const conversation = new ConversationEntity(42, 3, 8, new Date(), new Date());
const message = (id: number, convId = 42): MessageEntity =>
  new MessageEntity(id, convId, 3, 'salut', new Date(), new Date());

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let conversationRepo: jest.Mocked<IConversationRepository>;
  let messageRepo: jest.Mocked<IMessageRepository>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  beforeEach(() => {
    conversationRepo = {
      findByParticipants: jest.fn(),
      findById: jest.fn().mockResolvedValue(conversation),
      create: jest.fn(),
      listForUser: jest.fn(),
    };
    messageRepo = {
      create: jest.fn().mockResolvedValue(message(100)),
      findById: jest.fn(),
      findByConversation: jest.fn(),
      findLastByConversation: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() };
    useCase = new SendMessageUseCase(
      conversationRepo,
      messageRepo,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('persiste le message et émet message.created', async () => {
    const dto = await useCase.execute(3, 42, 'salut');

    expect(messageRepo.create).toHaveBeenCalledWith({
      conversationId: 42,
      authorId: 3,
      content: 'salut',
      responseToMessageId: undefined,
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      MESSAGE_CREATED_EVENT,
      expect.objectContaining({ conversationId: 42, message: dto }),
    );
  });

  it('lève ConversationNotFoundException si la conversation est absente', async () => {
    conversationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(3, 42, 'salut')).rejects.toThrow(
      ConversationNotFoundException,
    );
    expect(messageRepo.create).not.toHaveBeenCalled();
  });

  it('refuse un non-participant (403)', async () => {
    await expect(useCase.execute(99, 42, 'salut')).rejects.toThrow(
      NotAParticipantException,
    );
    expect(messageRepo.create).not.toHaveBeenCalled();
  });

  it("refuse une réponse vers un message d'une autre conversation", async () => {
    messageRepo.findById.mockResolvedValue(message(7, 51));

    await expect(useCase.execute(3, 42, 'salut', 7)).rejects.toThrow(
      InvalidMessageException,
    );
    expect(messageRepo.create).not.toHaveBeenCalled();
  });

  it('accepte une réponse vers un message de la même conversation', async () => {
    messageRepo.findById.mockResolvedValue(message(7, 42));

    await useCase.execute(3, 42, 'salut', 7);

    expect(messageRepo.create).toHaveBeenCalled();
  });
});
