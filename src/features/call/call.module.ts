import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CALL_REPOSITORY_PORT } from './application/ports/call.repository.port';
import { CONVERSATION_LOOKUP_PORT } from './application/ports/conversation-lookup.port';
import { USER_LOOKUP_PORT } from './application/ports/user-lookup.port';
import { AcceptCallUseCase } from './application/use-cases/accept-call.usecase';
import { DeclineCallUseCase } from './application/use-cases/decline-call.usecase';
import { GetActiveCallUseCase } from './application/use-cases/get-active-call.usecase';
import { GetCallHistoryUseCase } from './application/use-cases/get-call-history.usecase';
import { HangupCallUseCase } from './application/use-cases/hangup-call.usecase';
import { InitiateCallUseCase } from './application/use-cases/initiate-call.usecase';
import { JoinCallUseCase } from './application/use-cases/join-call.usecase';
import { CallRecoveryService } from './infrastructure/call-recovery.service';
import { CallController } from './infrastructure/input/call.controller';
import { CallGateway } from './infrastructure/input/call.gateway';
import { CallService } from './infrastructure/input/call.service';
import { ConversationLookupAdapter } from './infrastructure/output/conversation-lookup.adapter';
import { CallOrmEntity } from './infrastructure/output/orm/call.orm-entity';
import { PostgresCallRepository } from './infrastructure/output/postgres-call.repository';
import { UserLookupAdapter } from './infrastructure/output/user-lookup.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([CallOrmEntity])],
  controllers: [CallController],
  providers: [
    {
      provide: CALL_REPOSITORY_PORT,
      useClass: PostgresCallRepository,
    },
    {
      provide: CONVERSATION_LOOKUP_PORT,
      useClass: ConversationLookupAdapter,
    },
    {
      provide: USER_LOOKUP_PORT,
      useClass: UserLookupAdapter,
    },
    CallService,
    CallGateway,
    CallRecoveryService,
    InitiateCallUseCase,
    AcceptCallUseCase,
    DeclineCallUseCase,
    HangupCallUseCase,
    JoinCallUseCase,
    GetCallHistoryUseCase,
    GetActiveCallUseCase,
  ],
})
export class CallModule {}
