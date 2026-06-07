import { Inject, Injectable } from '@nestjs/common';
import { CallEntity } from '../../domain/entities/call.entity';
import { CallType } from '../../domain/enums/call-type.enum';
import { CallAlreadyInProgressException } from '../../domain/exceptions/call-already-in-progress.exception';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { NotACallParticipantException } from '../../domain/exceptions/not-a-call-participant.exception';
import type { ICallRepository } from '../ports/call.repository.port';
import { CALL_REPOSITORY_PORT } from '../ports/call.repository.port';
import type { IConversationLookup } from '../ports/conversation-lookup.port';
import { CONVERSATION_LOOKUP_PORT } from '../ports/conversation-lookup.port';

@Injectable()
export class InitiateCallUseCase {
  constructor(
    @Inject(CALL_REPOSITORY_PORT)
    private readonly callRepository: ICallRepository,
    @Inject(CONVERSATION_LOOKUP_PORT)
    private readonly conversationLookup: IConversationLookup,
  ) {}

  async execute(
    callerId: number,
    conversationId: number,
    type: CallType,
  ): Promise<CallEntity> {
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

    const existing =
      await this.callRepository.findActiveByConversation(conversationId);
    if (existing) {
      throw new CallAlreadyInProgressException();
    }

    const calleeId =
      conversation.participantAId === callerId
        ? conversation.participantBId
        : conversation.participantAId;

    return this.callRepository.create({
      conversationId,
      callerId,
      calleeId,
      type,
    });
  }
}
