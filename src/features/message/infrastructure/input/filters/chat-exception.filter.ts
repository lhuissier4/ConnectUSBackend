import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ConversationNotFoundException } from '../../../domain/exceptions/conversation-not-found.exception';
import { InvalidConversationException } from '../../../domain/exceptions/invalid-conversation.exception';
import { InvalidMessageException } from '../../../domain/exceptions/invalid-message.exception';
import { MessageNotFoundException } from '../../../domain/exceptions/message-not-found.exception';
import { NotAParticipantException } from '../../../domain/exceptions/not-a-participant.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';

type ChatException =
  | ConversationNotFoundException
  | MessageNotFoundException
  | UserNotFoundException
  | NotAParticipantException
  | InvalidConversationException
  | InvalidMessageException;

@Catch(
  ConversationNotFoundException,
  MessageNotFoundException,
  UserNotFoundException,
  NotAParticipantException,
  InvalidConversationException,
  InvalidMessageException,
)
export class ChatExceptionFilter implements ExceptionFilter {
  catch(exception: ChatException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = this.statusFor(exception);

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
    });
  }

  private statusFor(exception: ChatException): HttpStatus {
    if (
      exception instanceof ConversationNotFoundException ||
      exception instanceof MessageNotFoundException ||
      exception instanceof UserNotFoundException
    ) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof NotAParticipantException) {
      return HttpStatus.FORBIDDEN;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
