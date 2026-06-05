import { UserEntity } from '../../domain/entities/user.entity';

/**
 * Port de sortie : contrat de persistance des utilisateurs.
 * Le domaine et les cas d'usage en dépendent ; l'infrastructure le réalise
 * (cf. PostgresUserRepository). Toutes les méthodes échangent des UserEntity,
 * jamais des entités ORM.
 */
export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByName(firstName: string, lastName: string): Promise<UserEntity[]>;
  create(user: UserEntity): Promise<UserEntity>;
  delete(id: number): Promise<void>;
  isAdmin(userId: number): Promise<boolean>;
}

export const USER_REPOSITORY_PORT = Symbol('IUserRepository');
