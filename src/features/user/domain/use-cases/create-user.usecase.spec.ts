import { ForbiddenException } from '@nestjs/common';
import { AccountStatus, UserEntity } from '../entities/user.entity';
import { CreateUserPayload, IUserRepository } from '../ports/output/user.repository.port';
import { CreateUserUseCase } from './create-user.usecase';

const makeUserEntity = (): UserEntity =>
  new UserEntity(
    1, 'Jean', 'Dupont', 'jean@epsi.fr', 'hash',
    AccountStatus.TEACHER, false, new Date(), new Date(),
  );

const makePayload = (isAdmin = false): CreateUserPayload => ({
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean@epsi.fr',
  passwordHash: 'hash',
  status: AccountStatus.TEACHER,
  isAdmin,
});

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      isAdmin: jest.fn(),
    };
    useCase = new CreateUserUseCase(repository);
  });

  it('crée un utilisateur non-admin sans vérification', async () => {
    repository.create.mockResolvedValue(makeUserEntity());

    await useCase.execute(makePayload(false), 42);

    expect(repository.isAdmin).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(makePayload(false), 42);
  });

  it('crée un admin si le demandeur est admin', async () => {
    repository.isAdmin.mockResolvedValue(true);
    repository.create.mockResolvedValue(makeUserEntity());

    await useCase.execute(makePayload(true), 1);

    expect(repository.isAdmin).toHaveBeenCalledWith(1);
    expect(repository.create).toHaveBeenCalled();
  });

  it("lève ForbiddenException si le demandeur n'est pas admin et tente de créer un admin", async () => {
    repository.isAdmin.mockResolvedValue(false);

    await expect(useCase.execute(makePayload(true), 99)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("retourne l'entité créée", async () => {
    const expected = makeUserEntity();
    repository.create.mockResolvedValue(expected);

    const result = await useCase.execute(makePayload(false), 1);

    expect(result).toBe(expected);
  });
});
