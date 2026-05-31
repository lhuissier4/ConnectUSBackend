import { AccountStatus, StudentClass, UserEntity } from './user.entity';

const makeUser = (overrides: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  status: AccountStatus;
  studentClass?: StudentClass;
}> = {}): UserEntity => {
  const status = overrides.status ?? AccountStatus.TEACHER;
  const studentClass =
    status === AccountStatus.STUDENT
      ? (overrides.studentClass ?? StudentClass.M1)
      : overrides.studentClass;

  return new UserEntity(
    1,
    overrides.firstName ?? 'Jean',
    overrides.lastName ?? 'Dupont',
    overrides.email ?? 'jean@epsi.fr',
    'hash',
    status,
    false,
    new Date(),
    new Date(),
    undefined,
    undefined,
    undefined,
    undefined,
    studentClass,
  );
};

describe('UserEntity', () => {
  describe('construction valide', () => {
    it('crée un TEACHER sans studentClass', () => {
      expect(() => makeUser({ status: AccountStatus.TEACHER })).not.toThrow();
    });

    it('crée un STUDENT avec studentClass', () => {
      expect(() =>
        makeUser({ status: AccountStatus.STUDENT, studentClass: StudentClass.M1 }),
      ).not.toThrow();
    });

    it('crée un ALUMNI sans studentClass', () => {
      expect(() => makeUser({ status: AccountStatus.ALUMNI })).not.toThrow();
    });
  });

  describe('règles de validation', () => {
    it('lève une erreur si firstName est vide', () => {
      expect(() => makeUser({ firstName: '' })).toThrow(
        'Le prénom et le nom sont obligatoires.',
      );
    });

    it('lève une erreur si lastName est vide', () => {
      expect(() => makeUser({ lastName: '' })).toThrow(
        'Le prénom et le nom sont obligatoires.',
      );
    });

    it('lève une erreur si email est invalide', () => {
      expect(() => makeUser({ email: 'pas-un-email' })).toThrow(
        'Adresse e-mail invalide.',
      );
    });

    it('lève une erreur si STUDENT sans studentClass', () => {
      expect(
        () =>
          new UserEntity(
            1, 'Jean', 'Dupont', 'jean@epsi.fr', 'hash',
            AccountStatus.STUDENT, false, new Date(), new Date(),
          ),
      ).toThrow('La classe est obligatoire pour un étudiant.');
    });

    it('lève une erreur si non-STUDENT avec studentClass', () => {
      expect(
        () =>
          new UserEntity(
            1, 'Jean', 'Dupont', 'jean@epsi.fr', 'hash',
            AccountStatus.TEACHER, false, new Date(), new Date(),
            undefined, undefined, undefined, undefined, StudentClass.M1,
          ),
      ).toThrow('La classe ne doit pas être renseignée pour un non-étudiant.');
    });
  });

  describe('getFullName', () => {
    it('retourne le prénom et le nom concaténés', () => {
      const user = makeUser({ firstName: 'Jean', lastName: 'Dupont' });
      expect(user.getFullName()).toBe('Jean Dupont');
    });
  });
});
