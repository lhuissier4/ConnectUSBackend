import 'reflect-metadata';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { InvalidConversationException } from '../../domain/exceptions/invalid-conversation.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IConversationRepository } from '../ports/conversation.repository.port';
import { IUserLookup } from '../ports/user-lookup.port';
import { CreateConversationUseCase } from './create-conversation.usecase';

const conversation = (a: number, b: number): ConversationEntity =>
  new ConversationEntity(1, a, b, new Date(), new Date());

describe('CreateConversationUseCase', () => {
  let useCase: CreateConversationUseCase;
  let conversationRepo: jest.Mocked<IConversationRepository>;
  let userLookup: jest.Mocked<IUserLookup>;

  beforeEach(() => {
    conversationRepo = {
      findByParticipants: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      listForUser: jest.fn(),
    };
    userLookup = {
      exists: jest.fn().mockResolvedValue(true),
      getNames: jest.fn().mockResolvedValue(new Map([[3, 'Jean Dupont']])),
    };
    useCase = new CreateConversationUseCase(conversationRepo, userLookup);
  });

  it('crée une nouvelle conversation (created=true) avec paire normalisée', async () => {
    conversationRepo.findByParticipants.mockResolvedValue(null);
    conversationRepo.create.mockResolvedValue(conversation(3, 8));

    const result = await useCase.execute(8, 3);

    expect(conversationRepo.findByParticipants).toHaveBeenCalledWith(3, 8);
    expect(conversationRepo.create).toHaveBeenCalledWith(3, 8);
    expect(result.created).toBe(true);
    expect(result.conversation.otherParticipantId).toBe(3);
  });

  it('est idempotent : renvoie la conversation existante (created=false)', async () => {
    conversationRepo.findByParticipants.mockResolvedValue(conversation(3, 8));

    const result = await useCase.execute(3, 8);

    expect(conversationRepo.create).not.toHaveBeenCalled();
    expect(result.created).toBe(false);
    expect(result.conversation.otherParticipantId).toBe(8);
  });

  it('refuse une conversation avec soi-même', async () => {
    await expect(useCase.execute(7, 7)).rejects.toThrow(
      InvalidConversationException,
    );
    expect(conversationRepo.create).not.toHaveBeenCalled();
  });

  it("lève UserNotFoundException si la cible n'existe pas", async () => {
    userLookup.exists.mockImplementation((id) => Promise.resolve(id !== 99));

    await expect(useCase.execute(7, 99)).rejects.toThrow(UserNotFoundException);
    expect(conversationRepo.create).not.toHaveBeenCalled();
  });
});
