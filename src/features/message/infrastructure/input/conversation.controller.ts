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

  private parseRequestingUserId(raw: string | undefined): number {
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
      throw new Error('Invalid x-requesting-user-id header');
    }
    return n;
  }

  @Post()
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Headers('x-requesting-user-id') requestingUserId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = this.parseRequestingUserId(requestingUserId);
    const result = await this.chatService.createConversation(
      userId,
      dto.targetUserId,
    );
    res.status(result.created ? 201 : 200);
    return result.conversation;
  }

  @Get()
  listConversations(@Headers('x-requesting-user-id') requestingUserId: string) {
    return this.chatService.listConversations(
      this.parseRequestingUserId(requestingUserId),
    );
  }

  @Get(':id/messages')
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Headers('x-requesting-user-id') requestingUserId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('before', new ParseIntPipe({ optional: true })) before?: number,
  ) {
    return this.chatService.getConversationMessages(
      this.parseRequestingUserId(requestingUserId),
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
      this.parseRequestingUserId(requestingUserId),
      conversationId,
      dto.content,
      dto.responseToMessageId,
    );
  }
}
