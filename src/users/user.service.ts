import { Injectable } from '@nestjs/common';
import { CreateUserPayload } from '../features/user/ports/user.repository.port';
import { CreateUserUseCase } from '../features/user/use-cases/create-user.usecase';
import { DeleteUserUseCase } from '../features/user/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from '../features/user/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from '../features/user/use-cases/get-user-by-name.usecase';

@Injectable()
export class UserService {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUserByNameUseCase: GetUserByNameUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  getUserById(id: number) {
    return this.getUserByIdUseCase.execute(id);
  }

  getUserByName(firstName: string, lastName: string) {
    return this.getUserByNameUseCase.execute(firstName, lastName);
  }

  createUser(payload: CreateUserPayload, requestingUserId: number) {
    return this.createUserUseCase.execute(payload, requestingUserId);
  }

  deleteUser(id: number, requestingUserId: number) {
    return this.deleteUserUseCase.execute(id, requestingUserId);
  }
}
