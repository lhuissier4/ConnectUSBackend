import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { MessageEntity } from '../../domain/entities/message.entity';
import { ConversationDto } from '../dto/conversation.dto';
import { MessageMapper } from './message.mapper';

/**
 * Mapper de la couche application : ConversationEntity (domaine) → ConversationDto.
 * Le DTO est relatif à l'appelant (otherParticipantId) et porte le dernier
 * message (null à la création ou pour une conversation vide).
 */
export class ConversationMapper {
  static conversation_entity_to_conversation_dto(
    conversation: ConversationEntity,
    callerId: number,
    lastMessage: MessageEntity | null = null,
  ): ConversationDto {
    return new ConversationDto(
      conversation.id,
      conversation.otherParticipant(callerId),
      lastMessage
        ? MessageMapper.message_entity_to_message_dto(lastMessage)
        : null,
    );
  }
}
