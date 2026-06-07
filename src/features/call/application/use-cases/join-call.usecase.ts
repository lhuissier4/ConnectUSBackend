import { Inject, Injectable } from '@nestjs/common';
import { CallEntity } from '../../domain/entities/call.entity';
import { CallNotFoundException } from '../../domain/exceptions/call-not-found.exception';
import { NotACallParticipantException } from '../../domain/exceptions/not-a-call-participant.exception';
import type { ICallRepository } from '../ports/call.repository.port';
import { CALL_REPOSITORY_PORT } from '../ports/call.repository.port';

@Injectable()
export class JoinCallUseCase {
  constructor(
    @Inject(CALL_REPOSITORY_PORT)
    private readonly callRepository: ICallRepository,
  ) {}

  async execute(calleeId: number, callId: number): Promise<CallEntity> {
    const call = await this.callRepository.findById(callId);
    if (!call) {
      throw new CallNotFoundException(callId);
    }
    if (!call.isCallee(calleeId)) {
      throw new NotACallParticipantException(
        "Seul l'appelé peut rejoindre cet appel.",
      );
    }

    // join() lève InvalidCallStateTransitionException si la fenêtre de reprise
    // est expirée (l'appel est alors déjà ENDED).
    call.join();
    return this.callRepository.update(call);
  }
}
