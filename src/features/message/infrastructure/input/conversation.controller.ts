import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseFilters,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateConversationDto } from '../../application/dto/create-conversation.dto';
import { SendMessageDto } from '../../application/dto/send-message.dto';
import { ChatExceptionFilter } from './filters/chat-exception.filter';
import { ChatService } from './chat.service';

@UseFilters(new ChatExceptionFilter())
@Controller('conversations')
export class ConversationController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Headers('x-requesting-user-id') requestingUserId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.chatService.createConversation(
      Number(requestingUserId),
      dto.targetUserId,
    );
    res.status(result.created ? 201 : 200);
    return result.conversation;
  }

  @Get()
  listConversations(@Headers('x-requesting-user-id') requestingUserId: string) {
    return this.chatService.listConversations(Number(requestingUserId));
  }

  @Get(':id/messages')
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Headers('x-requesting-user-id') requestingUserId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('before', new ParseIntPipe({ optional: true })) before?: number,
  ) {
    return this.chatService.getConversationMessages(
      Number(requestingUserId),
      conversationId,
      limit,
      before,
    );
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: SendMessageDto,
    @Headers('x-requesting-user-id') requestingUserId: string,
  ) {
    return this.chatService.sendMessage(
      Number(requestingUserId),
      conversationId,
      dto.content,
      dto.responseToMessageId,
    );
  }
}
