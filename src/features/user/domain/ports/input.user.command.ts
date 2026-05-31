import { AccountStatus, StudentClass } from '../entities/user.entity';

/**
 * Port d'entrée : contrat d'exécution du cas d'usage de création d'utilisateur.
 *
 * C'est ce que consomment les adaptateurs d'entrée (HTTP, CLI, etc.) pour
 * piloter l'application. Volontairement découplé du port de sortie
 * (`CreateUserPayload` du repository) : un changement de la persistance
 * n'impacte pas le contrat d'entrée, et inversement.
 */
export interface InputUserCommand {
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
