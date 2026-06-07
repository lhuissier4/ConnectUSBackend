import { CallEntity } from '../../domain/entities/call.entity';
import { CallDto } from '../dto/call.dto';

/**
 * Mapper de la couche application : CallEntity (domaine) → CallDto.
 * La durée est calculée par l'entité (answeredAt → endedAt), null si l'appel
 * n'a pas été décroché ou n'est pas terminé.
 */
export class CallMapper {
  static call_entity_to_call_dto(call: CallEntity): CallDto {
    return new CallDto(
      call.id,
      call.conversationId,
      call.callerId,
      call.calleeId,
      call.status,
      call.type,
      call.startedAt,
      call.answeredAt,
      call.endedAt,
      call.endReason,
      call.durationSeconds,
    );
  }
}
