import { Inject, Injectable } from '@nestjs/common';
import { ConversationDto } from '../dto/conversation.dto';
import { ConversationMapper } from '../mappers/conversation.mapper';
import type { IConversationRepository } from '../ports/conversation.repository.port';
import { CONVERSATION_REPOSITORY_PORT } from '../ports/conversation.repository.port';
import type { IMessageRepository } from '../ports/message.repository.port';
import { MESSAGE_REPOSITORY_PORT } from '../ports/message.repository.port';

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY_PORT)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY_PORT)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async execute(callerId: number): Promise<ConversationDto[]> {
    // Les conversations sont déjà triées par activité récente côté repository.
    const conversations =
      await this.conversationRepository.listForUser(callerId);

    return Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await this.messageRepository.findLastByConversation(
          conversation.id,
        );
        return ConversationMapper.conversation_entity_to_conversation_dto(
          conversation,
          callerId,
          lastMessage,
        );
      }),
    );
  }
}
