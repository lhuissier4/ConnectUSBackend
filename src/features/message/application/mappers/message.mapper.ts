import { MessageEntity } from '../../domain/entities/message.entity';
import { MessageDto } from '../dto/message.dto';

/**
 * Mapper de la couche application : MessageEntity (domaine) → MessageDto (sortie).
 */
export class MessageMapper {
  static message_entity_to_message_dto(message: MessageEntity): MessageDto {
    return new MessageDto(
      message.id,
      message.conversationId,
      message.authorId,
      message.content,
      message.createdAt,
      message.responseToMessageId ?? null,
    );
  }
}
