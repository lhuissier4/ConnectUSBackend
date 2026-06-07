import { Inject, Injectable } from '@nestjs/common';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { NotACallParticipantException } from '../../domain/exceptions/not-a-call-participant.exception';
import { CallDto } from '../dto/call.dto';
import { CallMapper } from '../mappers/call.mapper';
import type { ICallRepository } from '../ports/call.repository.port';
import { CALL_REPOSITORY_PORT } from '../ports/call.repository.port';
import type { IConversationLookup } from '../ports/conversation-lookup.port';
import { CONVERSATION_LOOKUP_PORT } from '../ports/conversation-lookup.port';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class GetCallHistoryUseCase {
  constructor(
    @Inject(CALL_REPOSITORY_PORT)
    private readonly callRepository: ICallRepository,
    @Inject(CONVERSATION_LOOKUP_PORT)
    private readonly conversationLookup: IConversationLookup,
  ) {}

  async execute(
    callerId: number,
    conversationId: number,
    limit?: number,
    before?: number,
  ): Promise<CallDto[]> {
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

    const pageSize = Math.min(
      Math.max(limit ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );

    const calls = await this.callRepository.findByConversation(
      conversationId,
      pageSize,
      before,
    );

    return calls.map((call) => CallMapper.call_entity_to_call_dto(call));
  }
}
