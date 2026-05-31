import { AccountStatus, StudentClass, UserEntity } from '../entities/user.entity';

/**
 * Port de sortie : données nécessaires à la persistance d'un nouvel utilisateur.
 * Contrat propre à l'infrastructure, distinct du port d'entrée
 * (`InputUserCommand`).
 */
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  status: AccountStatus;
  isAdmin: boolean;
  phoneNumber?: string;
  photoUrl?: string;
  rgpdPreferences?: Record<string, unknown>;
  currentCourse?: string;
  studentClass?: StudentClass;
}

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByName(firstName: string, lastName: string): Promise<UserEntity[]>;
  create(
    payload: CreateUserPayload,
    requestingUserId: number,
  ): Promise<UserEntity>;
  delete(id: number): Promise<void>;
  isAdmin(userId: number): Promise<boolean>;
}

export const USER_REPOSITORY_PORT = Symbol('IUserRepository');
