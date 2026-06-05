import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import type { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    return user;
  }
}
