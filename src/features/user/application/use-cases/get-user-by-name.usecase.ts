import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import type { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';

@Injectable()
export class GetUserByNameUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(firstName: string, lastName: string): Promise<UserEntity[]> {
    const users = await this.userRepository.findByName(firstName, lastName);

    if (!users || users.length === 0) {
      throw new UserNotFoundException(-1);
    }

    return users;
  }
}
