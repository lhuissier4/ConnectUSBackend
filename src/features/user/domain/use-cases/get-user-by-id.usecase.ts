import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import type { IUserRepository } from '../ports/output.user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/output.user.repository.port';
import type { UserEntity } from '../entities/user.entity';

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
