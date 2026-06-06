import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONVERSATION_REPOSITORY_PORT } from './application/ports/conversation.repository.port';
import { MESSAGE_REPOSITORY_PORT } from './application/ports/message.repository.port';
import { USER_LOOKUP_PORT } from './application/ports/user-lookup.port';
import { CreateConversationUseCase } from './application/use-cases/create-conversation.usecase';
import { GetConversationMessagesUseCase } from './application/use-cases/get-conversation-messages.usecase';
import { ListConversationsUseCase } from './application/use-cases/list-conversations.usecase';
import { SendMessageUseCase } from './application/use-cases/send-message.usecase';
import { ChatGateway } from './infrastructure/input/chat.gateway';
import { ChatService } from './infrastructure/input/chat.service';
import { ConversationController } from './infrastructure/input/conversation.controller';
import { ConversationOrmEntity } from './infrastructure/output/orm/conversation.orm-entity';
import { MessageOrmEntity } from './infrastructure/output/orm/message.orm-entity';
import { PostgresConversationRepository } from './infrastructure/output/postgres-conversation.repository';
import { PostgresMessageRepository } from './infrastructure/output/postgres-message.repository';
import { UserLookupAdapter } from './infrastructure/output/user-lookup.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationOrmEntity, MessageOrmEntity]),
  ],
  controllers: [ConversationController],
  providers: [
    {
      provide: CONVERSATION_REPOSITORY_PORT,
      useClass: PostgresConversationRepository,
    },
    {
      provide: MESSAGE_REPOSITORY_PORT,
      useClass: PostgresMessageRepository,
    },
    {
      provide: USER_LOOKUP_PORT,
      useClass: UserLookupAdapter,
    },
    ChatService,
    ChatGateway,
    CreateConversationUseCase,
    ListConversationsUseCase,
    GetConversationMessagesUseCase,
    SendMessageUseCase,
  ],
})
export class MessageModule {}
