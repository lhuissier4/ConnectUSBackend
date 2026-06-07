import 'reflect-metadata';
import { UserEntity } from '../../domain/entities/user.entity';
import { AccountStatus } from '../../domain/entities/account-status.enum';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';
import { UserDto } from '../dto/user.dto';
import { IUserRepository } from '../ports/user.repository.port';
import { CreateUserUseCase } from './create-user.usecase';

const makeDto = (isAdmin = false): UserDto =>
  new UserDto(
    'Jean',
    'Dupont',
    'jean@epsi.fr',
    'hash',
    AccountStatus.TEACHER,
    isAdmin,
  );

const makeUserEntity = (): UserEntity =>
  new UserEntity(
    'Jean',
    'Dupont',
    'jean@epsi.fr',
    'hash',
    AccountStatus.TEACHER,
    false,
  );

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findCardById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      isAdmin: jest.fn(),
    };
    useCase = new CreateUserUseCase(repository);
  });

  it('crée un utilisateur non-admin sans vérification de permission', async () => {
    repository.create.mockResolvedValue(makeUserEntity());

    await useCase.execute(makeDto(false), 42);

    expect(repository.isAdmin).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@epsi.fr',
        passwordHash: 'hash',
        statusInSchool: AccountStatus.TEACHER,
        isAdmin: false,
      }),
    );
  });

  it('crée un admin si le demandeur est admin', async () => {
    repository.isAdmin.mockResolvedValue(true);
    repository.create.mockResolvedValue(makeUserEntity());

    await useCase.execute(makeDto(true), 1);

    expect(repository.isAdmin).toHaveBeenCalledWith(1);
    expect(repository.create).toHaveBeenCalled();
  });

  it("lève InsufficientPermissionsException si le demandeur n'est pas admin et tente de créer un admin", async () => {
    repository.isAdmin.mockResolvedValue(false);

    await expect(useCase.execute(makeDto(true), 99)).rejects.toThrow(
      InsufficientPermissionsException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("retourne l'entité créée", async () => {
    const expected = makeUserEntity();
    repository.create.mockResolvedValue(expected);

    const result = await useCase.execute(makeDto(false), 1);

    expect(result).toBe(expected);
  });
});
