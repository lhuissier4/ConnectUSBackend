import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY_PORT } from '../features/user/ports/user.repository.port';
import { CreateUserUseCase } from '../features/user/use-cases/create-user.usecase';
import { DeleteUserUseCase } from '../features/user/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from '../features/user/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from '../features/user/use-cases/get-user-by-name.usecase';
import { AccountAdminAccessOrmEntity } from '../features/user/adapters/orm/account-admin-access.orm-entity';
import { UserAccountOrmEntity } from '../features/user/adapters/orm/user-account.orm-entity';
import { PostgresUserRepository } from '../features/user/adapters/postgres-user.repository';
import { UserController } from './user.controller.js';
import { UserService } from './user.service';

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
