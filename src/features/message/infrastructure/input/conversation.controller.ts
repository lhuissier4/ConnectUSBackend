import {
  BadRequestException,
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
    const userId = Number(raw);
    if (!raw || Number.isNaN(userId) || !Number.isFinite(userId) || !Number.isInteger(userId)) {
      throw new BadRequestException('Header x-requesting-user-id invalide ou manquant.');
    }
    return userId;
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
  listConversations(@Headers('x-requesting-user-id') requestingUserId?: string) {
    const userId = this.parseRequestingUserId(requestingUserId);
    return this.chatService.listConversations(userId);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Headers('x-requesting-user-id') requestingUserId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('before', new ParseIntPipe({ optional: true })) before?: number,
  ) {
    const userId = this.parseRequestingUserId(requestingUserId);
    return this.chatService.getConversationMessages(
      userId,
      conversationId,
      limit,
      before,
    );
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: SendMessageDto,
    @Headers('x-requesting-user-id') requestingUserId?: string,
  ) {
    const userId = this.parseRequestingUserId(requestingUserId);
    return this.chatService.sendMessage(
      userId,
      conversationId,
      dto.content,
      dto.responseToMessageId,
    );
  }
}
