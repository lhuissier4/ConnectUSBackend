import { InvalidUserException } from '../exceptions/invalid-user.exception';
import { AccountStatus } from './account-status.enum';
import { StudentClass } from './student-class.enum';

export class UserEntity {
  constructor(
    public firstName: string,
    public lastName: string,
    public email: string,
    public passwordHash: string,
    public statusInSchool: AccountStatus,
    public isAdmin: boolean,
    public phoneNumber?: string,
    public photoUrl?: string,
    public rgpdPreferences?: Record<string, unknown>,
    public currentCourse?: string,
    public studentClass?: StudentClass,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.firstName || !this.lastName) {
      throw new InvalidUserException('Le prénom et le nom sont obligatoires.');
    }
    if (!this.email || !this.email.includes('@')) {
      throw new InvalidUserException('Adresse e-mail invalide.');
    }
    if (this.statusInSchool === AccountStatus.STUDENT && !this.studentClass) {
      throw new InvalidUserException(
        'La classe est obligatoire pour un étudiant.',
      );
    }
    if (this.statusInSchool !== AccountStatus.STUDENT && this.studentClass) {
      throw new InvalidUserException(
        'La classe ne doit pas être renseignée pour un non-étudiant.',
      );
    }
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
