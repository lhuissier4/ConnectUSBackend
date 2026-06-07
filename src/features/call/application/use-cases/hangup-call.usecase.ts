import { Inject, Injectable } from '@nestjs/common';
import { CallEntity } from '../../domain/entities/call.entity';
import { CallNotFoundException } from '../../domain/exceptions/call-not-found.exception';
import { NotACallParticipantException } from '../../domain/exceptions/not-a-call-participant.exception';
import type { ICallRepository } from '../ports/call.repository.port';
import { CALL_REPOSITORY_PORT } from '../ports/call.repository.port';

@Injectable()
export class HangupCallUseCase {
  constructor(
    @Inject(CALL_REPOSITORY_PORT)
    private readonly callRepository: ICallRepository,
  ) {}

  async execute(userId: number, callId: number): Promise<CallEntity> {
    const call = await this.callRepository.findById(callId);
    if (!call) {
      throw new CallNotFoundException(callId);
    }
    if (!call.hasParticipant(userId)) {
      throw new NotACallParticipantException();
    }

    // L'entité dérive le motif (HANGUP / CALLER_HANGUP) de l'état courant.
    call.hangup();
    return this.callRepository.update(call);
  }
}
