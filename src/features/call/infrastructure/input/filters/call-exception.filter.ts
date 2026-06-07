import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CallAlreadyInProgressException } from '../../../domain/exceptions/call-already-in-progress.exception';
import { CallNotFoundException } from '../../../domain/exceptions/call-not-found.exception';
import { ConversationNotFoundException } from '../../../domain/exceptions/conversation-not-found.exception';
import { InvalidCallException } from '../../../domain/exceptions/invalid-call.exception';
import { InvalidCallStateTransitionException } from '../../../domain/exceptions/invalid-call-state-transition.exception';
import { NotACallParticipantException } from '../../../domain/exceptions/not-a-call-participant.exception';

type CallException =
  | CallNotFoundException
  | ConversationNotFoundException
  | NotACallParticipantException
  | CallAlreadyInProgressException
  | InvalidCallException
  | InvalidCallStateTransitionException;

@Catch(
  CallNotFoundException,
  ConversationNotFoundException,
  NotACallParticipantException,
  CallAlreadyInProgressException,
  InvalidCallException,
  InvalidCallStateTransitionException,
)
export class CallExceptionFilter implements ExceptionFilter {
  catch(exception: CallException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = this.statusFor(exception);

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
    });
  }

  private statusFor(exception: CallException): HttpStatus {
    if (
      exception instanceof CallNotFoundException ||
      exception instanceof ConversationNotFoundException
    ) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof NotACallParticipantException) {
      return HttpStatus.FORBIDDEN;
    }
    if (exception instanceof CallAlreadyInProgressException) {
      return HttpStatus.CONFLICT;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
