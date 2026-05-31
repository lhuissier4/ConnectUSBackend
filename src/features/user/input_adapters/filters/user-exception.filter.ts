import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';

@Catch(UserNotFoundException, InsufficientPermissionsException)
export class UserExceptionFilter implements ExceptionFilter {
  catch(
    exception: UserNotFoundException | InsufficientPermissionsException,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof UserNotFoundException
        ? HttpStatus.NOT_FOUND
        : HttpStatus.FORBIDDEN;

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
    });
  }
}
