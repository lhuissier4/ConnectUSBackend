import { Inject, Injectable } from '@nestjs/common';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { NotACallParticipantException } from '../../domain/exceptions/not-a-call-participant.exception';
import { CallDto } from '../dto/call.dto';
import { CallMapper } from '../mappers/call.mapper';
import type { ICallRepository } from '../ports/call.repository.port';
import { CALL_REPOSITORY_PORT } from '../ports/call.repository.port';
import type { IConversationLookup } from '../ports/conversation-lookup.port';
import { CONVERSATION_LOOKUP_PORT } from '../ports/conversation-lookup.port';

@Injectable()
export class GetActiveCallUseCase {
  constructor(
    @Inject(CALL_REPOSITORY_PORT)
    private readonly callRepository: ICallRepository,
    @Inject(CONVERSATION_LOOKUP_PORT)
    private readonly conversationLookup: IConversationLookup,
  ) {}

  /** Retourne l'appel en cours (RINGING / ACTIVE / MISSED) d'une conversation, ou null. */
  async execute(
    callerId: number,
    conversationId: number,
  ): Promise<CallDto | null> {
    const conversation = await this.conversationLookup.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }
    const isParticipant =
      conversation.participantAId === callerId ||
      conversation.participantBId === callerId;
    if (!isParticipant) {
      throw new NotACallParticipantException();
    }

    const call =
      await this.callRepository.findActiveByConversation(conversationId);
    return call ? CallMapper.call_entity_to_call_dto(call) : null;
  }
}
