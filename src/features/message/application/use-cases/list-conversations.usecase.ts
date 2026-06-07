import { Inject, Injectable } from '@nestjs/common';
import { ConversationDto } from '../dto/conversation.dto';
import { ConversationMapper } from '../mappers/conversation.mapper';
import type { IConversationRepository } from '../ports/conversation.repository.port';
import { CONVERSATION_REPOSITORY_PORT } from '../ports/conversation.repository.port';
import type { IMessageRepository } from '../ports/message.repository.port';
import { MESSAGE_REPOSITORY_PORT } from '../ports/message.repository.port';
import type { IUserLookup } from '../ports/user-lookup.port';
import { USER_LOOKUP_PORT } from '../ports/user-lookup.port';

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY_PORT)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY_PORT)
    private readonly messageRepository: IMessageRepository,
    @Inject(USER_LOOKUP_PORT)
    private readonly userLookup: IUserLookup,
  ) {}

  async execute(callerId: number): Promise<ConversationDto[]> {
    // Les conversations sont déjà triées par activité récente côté repository.
    const conversations =
      await this.conversationRepository.listForUser(callerId);

    const withLast = await Promise.all(
      conversations.map(async (conversation) => ({
        conversation,
        lastMessage: await this.messageRepository.findLastByConversation(
          conversation.id,
        ),
      })),
    );

    // Résolution groupée des noms : interlocuteurs + auteurs des derniers messages.
    const ids = new Set<number>();
    for (const { conversation, lastMessage } of withLast) {
      ids.add(conversation.otherParticipant(callerId));
      if (lastMessage) ids.add(lastMessage.authorId);
    }
    const names = await this.userLookup.getNames([...ids]);
    const nameOf = (id: number): string =>
      names.get(id) ?? `Utilisateur ${id}`;

    return withLast.map(({ conversation, lastMessage }) =>
      ConversationMapper.conversation_entity_to_conversation_dto(
        conversation,
        callerId,
        nameOf(conversation.otherParticipant(callerId)),
        lastMessage,
        lastMessage ? nameOf(lastMessage.authorId) : undefined,
      ),
    );
  }
}
