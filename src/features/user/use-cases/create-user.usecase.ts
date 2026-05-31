import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type {
  CreateUserPayload,
  IUserRepository,
} from '../ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserEntity } from '../user.entity';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Crée un nouvel utilisateur.
   *
   * @param payload          - Les données du nouvel utilisateur.
   *                           Le champ `isAdmin` (boolean) indique si le compte doit
   *                           bénéficier de droits administrateur.
   * @param requestingUserId - L'identifiant de l'utilisateur effectuant la demande.
   *                           Doit être admin si `payload.isAdmin` est true.
   */
  async execute(
    payload: CreateUserPayload,
    requestingUserId: number,
  ): Promise<UserEntity> {
    if (payload.isAdmin) {
      const requesterIsAdmin =
        await this.userRepository.isAdmin(requestingUserId);

      if (!requesterIsAdmin) {
        throw new ForbiddenException(
          'Seul un administrateur peut créer un compte avec des droits administrateur.',
        );
      }
    }

    return this.userRepository.create(payload, requestingUserId);
  }
}
