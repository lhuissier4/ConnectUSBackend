import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsException } from '../exceptions/insufficient-permissions.exception';
import type { InputUserCommand } from '../ports/input.user.command';
import type {
  CreateUserPayload,
  IUserRepository,
} from '../ports/output.user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/output.user.repository.port';
import type { UserEntity } from '../entities/user.entity';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    command: InputUserCommand,
    requestingUserId: number,
  ): Promise<UserEntity> {
    if (command.isAdmin) {
      const requesterIsAdmin =
        await this.userRepository.isAdmin(requestingUserId);

      if (!requesterIsAdmin) {
        throw new InsufficientPermissionsException(
          'Seul un administrateur peut créer un compte avec des droits administrateur.',
        );
      }
    }

    // Traduction du port d'entrée (command) vers le port de sortie (payload).
    const payload: CreateUserPayload = {
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      passwordHash: command.passwordHash,
      status: command.status,
      isAdmin: command.isAdmin,
      phoneNumber: command.phoneNumber,
      photoUrl: command.photoUrl,
      rgpdPreferences: command.rgpdPreferences,
      currentCourse: command.currentCourse,
      studentClass: command.studentClass,
    };

    return this.userRepository.create(payload, requestingUserId);
  }
}
