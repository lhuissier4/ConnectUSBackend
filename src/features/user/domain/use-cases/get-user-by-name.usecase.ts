import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../ports/output/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/output/user.repository.port';
import type { UserEntity } from '../entities/user.entity';

@Injectable()
export class GetUserByNameUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Recherche des utilisateurs par prénom et nom.
   * @param firstName - Le prénom de l'utilisateur.
   * @param lastName  - Le nom de l'utilisateur.
   */
  async execute(firstName: string, lastName: string): Promise<UserEntity[]> {
    const users = await this.userRepository.findByName(firstName, lastName);

    if (!users || users.length === 0) {
      throw new NotFoundException(
        `Aucun utilisateur trouvé avec le nom "${firstName} ${lastName}".`,
      );
    }

    return users;
  }
}
