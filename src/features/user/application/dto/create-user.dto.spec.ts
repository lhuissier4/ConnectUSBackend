import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './user.dto';
import { AccountStatus } from '../../domain/entities/account-status.enum';
import { StudentClass } from '../../domain/entities/student-class.enum';

const validBase = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean@epsi.fr',
  passwordHash: 'hashedpass',
  statusInSchool: AccountStatus.TEACHER,
  isAdmin: false,
};

const toDto = (data: object) => plainToInstance(UserDto, data);

describe('CreateUserDto', () => {
  it('valide un payload correct (TEACHER)', async () => {
    const errors = await validate(toDto(validBase));
    expect(errors).toHaveLength(0);
  });

  it('valide un STUDENT avec studentClass', async () => {
    const errors = await validate(
      toDto({ ...validBase, statusInSchool: AccountStatus.STUDENT, studentClass: StudentClass.M1 }),
    );
    expect(errors).toHaveLength(0);
  });

  it('valide un payload avec champs optionnels', async () => {
    const errors = await validate(
      toDto({ ...validBase, phoneNumber: '0601020304', photoUrl: 'https://img.fr/photo.jpg' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejette un email invalide', async () => {
    const errors = await validate(toDto({ ...validBase, email: 'pas-un-email' }));
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejette un firstName vide', async () => {
    const errors = await validate(toDto({ ...validBase, firstName: '' }));
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('rejette un firstName manquant', async () => {
    const { firstName, ...without } = validBase;
    const errors = await validate(toDto(without));
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('rejette un statusInSchool inconnu', async () => {
    const errors = await validate(toDto({ ...validBase, statusInSchool: 'UNKNOWN' }));
    expect(errors.some((e) => e.property === 'statusInSchool')).toBe(true);
  });

  it('rejette un STUDENT sans studentClass', async () => {
    const errors = await validate(
      toDto({ ...validBase, statusInSchool: AccountStatus.STUDENT }),
    );
    expect(errors.some((e) => e.property === 'studentClass')).toBe(true);
  });

  it('accepte un TEACHER sans studentClass', async () => {
    const errors = await validate(toDto({ ...validBase, statusInSchool: AccountStatus.TEACHER }));
    expect(errors).toHaveLength(0);
  });
});
