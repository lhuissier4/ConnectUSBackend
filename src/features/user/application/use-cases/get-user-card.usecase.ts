import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { UserCardDto } from '../dto/user-card.dto';
import type { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';

/**
 * Lecture de la carte publique d'un utilisateur (id + nom), pour le login et
 * la résolution de nom côté client. Lève si l'utilisateur n'existe pas.
 */
@Injectable()
export class GetUserCardUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<UserCardDto> {
    const card = await this.userRepository.findCardById(id);
    if (!card) {
      throw new UserNotFoundException(id);
    }
    return card;
  }
}
