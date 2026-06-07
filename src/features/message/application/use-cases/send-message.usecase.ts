import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { InvalidMessageException } from '../../domain/exceptions/invalid-message.exception';
import { NotAParticipantException } from '../../domain/exceptions/not-a-participant.exception';
import { MessageDto } from '../dto/message.dto';
import {
  MESSAGE_CREATED_EVENT,
  MessageCreatedEvent,
} from '../events/message-created.event';
import { MessageMapper } from '../mappers/message.mapper';
import type { IConversationRepository } from '../ports/conversation.repository.port';
import { CONVERSATION_REPOSITORY_PORT } from '../ports/conversation.repository.port';
import type { IMessageRepository } from '../ports/message.repository.port';
import { MESSAGE_REPOSITORY_PORT } from '../ports/message.repository.port';
import type { IUserLookup } from '../ports/user-lookup.port';
import { USER_LOOKUP_PORT } from '../ports/user-lookup.port';

@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY_PORT)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY_PORT)
    private readonly messageRepository: IMessageRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(USER_LOOKUP_PORT)
    private readonly userLookup: IUserLookup,
  ) {}

  async execute(
    callerId: number,
    conversationId: number,
    content: string,
    responseToMessageId?: number,
  ): Promise<MessageDto> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }
    if (!conversation.hasParticipant(callerId)) {
      throw new NotAParticipantException();
    }

    if (responseToMessageId !== undefined) {
      const repliedTo =
        await this.messageRepository.findById(responseToMessageId);
      if (!repliedTo || repliedTo.conversationId !== conversationId) {
        throw new InvalidMessageException(
          'Le message cité doit appartenir à la même conversation.',
        );
      }
    }

    const message = await this.messageRepository.create({
      conversationId,
      authorId: callerId,
      content,
      responseToMessageId,
    });

    const names = await this.userLookup.getNames([callerId]);
    const authorName = names.get(callerId) ?? `Utilisateur ${callerId}`;
    const dto = MessageMapper.message_entity_to_message_dto(message, authorName);
    this.eventEmitter.emit(
      MESSAGE_CREATED_EVENT,
      new MessageCreatedEvent(conversationId, dto, [
        conversation.participantAId,
        conversation.participantBId,
      ]),
    );
    return dto;
  }
}
