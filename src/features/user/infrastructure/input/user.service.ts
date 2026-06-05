import { Injectable } from '@nestjs/common';

import { CreateUserUseCase } from '../../application/use-cases/create-user.usecase';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from '../../application/use-cases/get-user-by-name.usecase';
import { UserDto } from '../../application/dto/user.dto';

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

  createUser(dto: UserDto, requestingUserId: number) {
    return this.createUserUseCase.execute(dto, requestingUserId);
  }

  deleteUser(id: number, requestingUserId: number) {
    return this.deleteUserUseCase.execute(id, requestingUserId);
  }
}
