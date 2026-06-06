import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../domain/entities/user.entity';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';
import { UserMapper } from '../mappers/user.mapper';
import { UserDto } from '../dto/user.dto';
import type { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: UserDto, requestingUserId: number): Promise<UserEntity> {
    if (dto.isAdmin) {
      const requesterIsAdmin =
        await this.userRepository.isAdmin(requestingUserId);

      if (!requesterIsAdmin) {
        throw new InsufficientPermissionsException(
          'Seul un administrateur peut créer un compte avec des droits administrateur.',
        );
      }
    }

    const user: UserEntity = UserMapper.user_dto_to_user_entity(dto);

    return this.userRepository.create(user);
  }
}
