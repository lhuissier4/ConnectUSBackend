import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import type { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number, requestingUserId: number): Promise<void> {
    const requesterIsAdmin =
      await this.userRepository.isAdmin(requestingUserId);

    if (!requesterIsAdmin) {
      throw new InsufficientPermissionsException(
        'Seul un administrateur peut supprimer un compte utilisateur.',
      );
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException(id);
    }

    await this.userRepository.delete(id);
  }
}
