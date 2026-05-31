export enum AccountStatus {
  STUDENT = 'STUDENT',
  ALUMNI = 'ALUMNI',
  TEACHER = 'TEACHER',
}

export enum StudentClass {
  I1 = 'I1',
  I2 = 'I2',
  I3 = 'I3',
  M1 = 'M1',
  M2 = 'M2',
}

export class UserEntity {
  constructor(
    public readonly id: number,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly status: AccountStatus,
    public readonly isAdmin: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
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
      throw new Error('Le prénom et le nom sont obligatoires.');
    }
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Adresse e-mail invalide.');
    }
    if (this.status === AccountStatus.STUDENT && !this.studentClass) {
      throw new Error('La classe est obligatoire pour un étudiant.');
    }
    if (this.status !== AccountStatus.STUDENT && this.studentClass) {
      throw new Error(
        'La classe ne doit pas être renseignée pour un non-étudiant.',
      );
    }
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
