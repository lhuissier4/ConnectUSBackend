import 'reflect-metadata';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { MessageEntity } from '../../domain/entities/message.entity';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { NotAParticipantException } from '../../domain/exceptions/not-a-participant.exception';
import { IConversationRepository } from '../ports/conversation.repository.port';
import { IMessageRepository } from '../ports/message.repository.port';
import { GetConversationMessagesUseCase } from './get-conversation-messages.usecase';

const conversation = new ConversationEntity(42, 3, 8, new Date(), new Date());

describe('GetConversationMessagesUseCase', () => {
  let useCase: GetConversationMessagesUseCase;
  let conversationRepo: jest.Mocked<IConversationRepository>;
  let messageRepo: jest.Mocked<IMessageRepository>;

  beforeEach(() => {
    conversationRepo = {
      findByParticipants: jest.fn(),
      findById: jest.fn().mockResolvedValue(conversation),
      create: jest.fn(),
      listForUser: jest.fn(),
    };
    messageRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByConversation: jest
        .fn()
        .mockResolvedValue([
          new MessageEntity(1, 42, 3, 'a', new Date(), new Date()),
        ]),
      findLastByConversation: jest.fn(),
    };
    useCase = new GetConversationMessagesUseCase(conversationRepo, messageRepo);
  });

  it('lève ConversationNotFoundException si la conversation est absente', async () => {
    conversationRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(3, 42)).rejects.toThrow(
      ConversationNotFoundException,
    );
  });

  it('refuse un non-participant (403)', async () => {
    await expect(useCase.execute(99, 42)).rejects.toThrow(
      NotAParticipantException,
    );
  });

  it('applique la taille de page par défaut (20) sans curseur', async () => {
    await useCase.execute(3, 42);
    expect(messageRepo.findByConversation).toHaveBeenCalledWith(
      42,
      20,
      undefined,
    );
  });

  it('transmet le curseur before et borne la limite', async () => {
    await useCase.execute(3, 42, 999, 50);
    expect(messageRepo.findByConversation).toHaveBeenCalledWith(42, 100, 50);
  });
});
