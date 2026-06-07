import { Injectable } from '@nestjs/common';

import { CreateUserUseCase } from '../../application/use-cases/create-user.usecase';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.usecase';
import { GetUserCardUseCase } from '../../application/use-cases/get-user-card.usecase';
import { GetUserByNameUseCase } from '../../application/use-cases/get-user-by-name.usecase';
import { UserDto } from '../../application/dto/user.dto';
import { UserMapper } from '../../application/mappers/user.mapper';

@Injectable()
export class UserService {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUserCardUseCase: GetUserCardUseCase,
    private readonly getUserByNameUseCase: GetUserByNameUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async getUserById(id: number) {
    // Profil complet SAUF passwordHash (la fuite est retirée du chemin client).
    const user = await this.getUserByIdUseCase.execute(id);
    return UserMapper.user_entity_to_profile(user);
  }

  getUserCard(id: number) {
    return this.getUserCardUseCase.execute(id);
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
