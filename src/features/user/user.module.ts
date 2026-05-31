import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY_PORT } from './domain/ports/output.user.repository.port';
import { CreateUserUseCase } from './domain/use-cases/create-user.usecase';
import { DeleteUserUseCase } from './domain/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from './domain/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from './domain/use-cases/get-user-by-name.usecase';
import { AccountAdminAccessOrmEntity } from './output_adapters/orm/account-admin-access.orm-entity';
import { UserAccountOrmEntity } from './output_adapters/orm/user-account.orm-entity';
import { PostgresUserRepository } from './output_adapters/postgres-user.repository';
import { UserController } from './input_adapters/user.controller';
import { UserService } from './input_adapters/user.service';

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
