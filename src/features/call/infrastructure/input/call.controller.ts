import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CallService } from './call.service';
import { CallExceptionFilter } from './filters/call-exception.filter';

@UseFilters(new CallExceptionFilter())
@Controller('conversations/:conversationId/calls')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Get()
  getCallHistory(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Headers('x-requesting-user-id') requestingUserId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('before', new ParseIntPipe({ optional: true })) before?: number,
  ) {
    return this.callService.getCallHistory(
      Number(requestingUserId),
      conversationId,
      limit,
      before,
    );
  }

  @Get('active')
  getActiveCall(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Headers('x-requesting-user-id') requestingUserId: string,
  ) {
    return this.callService.getActiveCall(
      Number(requestingUserId),
      conversationId,
    );
  }
}
