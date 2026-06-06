import { Injectable } from '@nestjs/common';
import { ConversationDto } from '../../application/dto/conversation.dto';
import { MessageDto } from '../../application/dto/message.dto';
import {
  CreateConversationResult,
  CreateConversationUseCase,
} from '../../application/use-cases/create-conversation.usecase';
import { GetConversationMessagesUseCase } from '../../application/use-cases/get-conversation-messages.usecase';
import { ListConversationsUseCase } from '../../application/use-cases/list-conversations.usecase';
import { SendMessageUseCase } from '../../application/use-cases/send-message.usecase';

@Injectable()
export class ChatService {
  constructor(
    private readonly createConversationUseCase: CreateConversationUseCase,
    private readonly listConversationsUseCase: ListConversationsUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
  ) {}

  createConversation(
    callerId: number,
    targetUserId: number,
  ): Promise<CreateConversationResult> {
    return this.createConversationUseCase.execute(callerId, targetUserId);
  }

  listConversations(callerId: number): Promise<ConversationDto[]> {
    return this.listConversationsUseCase.execute(callerId);
  }

  getConversationMessages(
    callerId: number,
    conversationId: number,
    limit?: number,
    before?: number,
  ): Promise<MessageDto[]> {
    return this.getConversationMessagesUseCase.execute(
      callerId,
      conversationId,
      limit,
      before,
    );
  }

  sendMessage(
    callerId: number,
    conversationId: number,
    content: string,
    responseToMessageId?: number,
  ): Promise<MessageDto> {
    return this.sendMessageUseCase.execute(
      callerId,
      conversationId,
      content,
      responseToMessageId,
    );
  }
}
