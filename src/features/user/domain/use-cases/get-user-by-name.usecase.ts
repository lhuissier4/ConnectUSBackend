import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import type { IUserRepository } from '../ports/output.user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/output.user.repository.port';
import type { UserEntity } from '../entities/user.entity';

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
