import { Inject, Injectable } from '@nestjs/common';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { ConversationDto } from '../dto/conversation.dto';
import { ConversationMapper } from '../mappers/conversation.mapper';
import type { IConversationRepository } from '../ports/conversation.repository.port';
import { CONVERSATION_REPOSITORY_PORT } from '../ports/conversation.repository.port';
import type { IUserLookup } from '../ports/user-lookup.port';
import { USER_LOOKUP_PORT } from '../ports/user-lookup.port';

export interface CreateConversationResult {
  conversation: ConversationDto;
  created: boolean;
}

@Injectable()
export class CreateConversationUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY_PORT)
    private readonly conversationRepository: IConversationRepository,
    @Inject(USER_LOOKUP_PORT)
    private readonly userLookup: IUserLookup,
  ) {}

  async execute(
    callerId: number,
    targetUserId: number,
  ): Promise<CreateConversationResult> {
    // Lève InvalidConversationException si callerId === targetUserId.
    const [participantAId, participantBId] = ConversationEntity.normalizePair(
      callerId,
      targetUserId,
    );

    for (const id of [callerId, targetUserId]) {
      if (!(await this.userLookup.exists(id))) {
        throw new UserNotFoundException(id);
      }
    }

    // L'interlocuteur (relatif à l'appelant) est la cible : on résout son nom.
    const names = await this.userLookup.getNames([targetUserId]);
    const otherName = names.get(targetUserId) ?? `Utilisateur ${targetUserId}`;

    const existing = await this.conversationRepository.findByParticipants(
      participantAId,
      participantBId,
    );
    if (existing) {
      return {
        conversation:
          ConversationMapper.conversation_entity_to_conversation_dto(
            existing,
            callerId,
            otherName,
          ),
        created: false,
      };
    }

    const created = await this.conversationRepository.create(
      participantAId,
      participantBId,
    );
    return {
      conversation: ConversationMapper.conversation_entity_to_conversation_dto(
        created,
        callerId,
        otherName,
      ),
      created: true,
    };
  }
}
