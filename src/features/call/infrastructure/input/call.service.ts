import { Injectable, NotFoundException } from '@nestjs/common';
import { CallDto } from '../../application/dto/call.dto';
import { GetActiveCallUseCase } from '../../application/use-cases/get-active-call.usecase';
import { GetCallHistoryUseCase } from '../../application/use-cases/get-call-history.usecase';

@Injectable()
export class CallService {
  constructor(
    private readonly getCallHistoryUseCase: GetCallHistoryUseCase,
    private readonly getActiveCallUseCase: GetActiveCallUseCase,
  ) {}

  getCallHistory(
    callerId: number,
    conversationId: number,
    limit?: number,
    before?: number,
  ): Promise<CallDto[]> {
    return this.getCallHistoryUseCase.execute(
      callerId,
      conversationId,
      limit,
      before,
    );
  }

  async getActiveCall(
    callerId: number,
    conversationId: number,
  ): Promise<CallDto> {
    const call = await this.getActiveCallUseCase.execute(
      callerId,
      conversationId,
    );
    if (!call) {
      throw new NotFoundException(
        'Aucun appel en cours pour cette conversation.',
      );
    }
    return call;
  }
}
