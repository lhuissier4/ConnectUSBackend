import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { DeleteUserUseCase } from './application/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from './application/use-cases/get-user-by-name.usecase';
import { AccountAdminAccessOrmEntity } from './infrastructure/output/orm/account-admin-access.orm-entity';
import { UserAccountOrmEntity } from './infrastructure/output/orm/user-account.orm-entity';
import { PostgresUserRepository } from './infrastructure/output/postgres-user.repository';
import { UserController } from './infrastructure/input/user.controller';
import { UserService } from './infrastructure/input/user.service';
import { USER_REPOSITORY_PORT } from './application/ports/user.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAccountOrmEntity,
      AccountAdminAccessOrmEntity,
    ]),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: PostgresUserRepository,
    },
    UserService,
    GetUserByIdUseCase,
    GetUserByNameUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
