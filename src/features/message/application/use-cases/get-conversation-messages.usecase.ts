import { Inject, Injectable } from '@nestjs/common';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { NotAParticipantException } from '../../domain/exceptions/not-a-participant.exception';
import { MessageDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import type { IConversationRepository } from '../ports/conversation.repository.port';
import { CONVERSATION_REPOSITORY_PORT } from '../ports/conversation.repository.port';
import type { IMessageRepository } from '../ports/message.repository.port';
import { MESSAGE_REPOSITORY_PORT } from '../ports/message.repository.port';
import type { IUserLookup } from '../ports/user-lookup.port';
import { USER_LOOKUP_PORT } from '../ports/user-lookup.port';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class GetConversationMessagesUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY_PORT)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY_PORT)
    private readonly messageRepository: IMessageRepository,
    @Inject(USER_LOOKUP_PORT)
    private readonly userLookup: IUserLookup,
  ) {}

  async execute(
    callerId: number,
    conversationId: number,
    limit?: number,
    before?: number,
  ): Promise<MessageDto[]> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }
    if (!conversation.hasParticipant(callerId)) {
      throw new NotAParticipantException();
    }

    const pageSize = Math.min(
      Math.max(limit ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );

    const messages = await this.messageRepository.findByConversation(
      conversationId,
      pageSize,
      before,
    );

    const authorIds = [...new Set(messages.map((m) => m.authorId))];
    const names = await this.userLookup.getNames(authorIds);

    return messages.map((message) =>
      MessageMapper.message_entity_to_message_dto(
        message,
        names.get(message.authorId) ?? `Utilisateur ${message.authorId}`,
      ),
    );
  }
}
