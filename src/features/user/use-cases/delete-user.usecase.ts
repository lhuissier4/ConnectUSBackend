import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Supprime un utilisateur par son identifiant.
   * Seul un administrateur peut effectuer cette action.
   *
   * @param id               - L'identifiant de l'utilisateur à supprimer.
   * @param requestingUserId - L'identifiant de l'utilisateur effectuant la demande.
   */
  async execute(id: number, requestingUserId: number): Promise<void> {
    const requesterIsAdmin =
      await this.userRepository.isAdmin(requestingUserId);

    if (!requesterIsAdmin) {
      throw new ForbiddenException(
        'Seul un administrateur peut supprimer un compte utilisateur.',
      );
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(
        `Aucun utilisateur trouvé avec l'identifiant ${id}.`,
      );
    }

    await this.userRepository.delete(id);
  }
}
