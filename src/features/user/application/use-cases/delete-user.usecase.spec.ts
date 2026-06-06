import { UserEntity } from '../../domain/entities/user.entity';
import { AccountStatus } from '../../domain/entities/account-status.enum';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../ports/user.repository.port';
import { DeleteUserUseCase } from './delete-user.usecase';

const makeUserEntity = (): UserEntity =>
  new UserEntity(
    'Marie',
    'Martin',
    'marie@epsi.fr',
    'hash',
    AccountStatus.ALUMNI,
    false,
  );

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      isAdmin: jest.fn(),
    };
    useCase = new DeleteUserUseCase(repository);
  });

  it("lève InsufficientPermissionsException si le demandeur n'est pas admin", async () => {
    repository.isAdmin.mockResolvedValue(false);

    await expect(useCase.execute(5, 99)).rejects.toThrow(
      InsufficientPermissionsException,
    );
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("lève UserNotFoundException si l'utilisateur cible n'existe pas", async () => {
    repository.isAdmin.mockResolvedValue(true);
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999, 1)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("supprime l'utilisateur si le demandeur est admin et l'utilisateur existe", async () => {
    repository.isAdmin.mockResolvedValue(true);
    repository.findById.mockResolvedValue(makeUserEntity());
    repository.delete.mockResolvedValue(undefined);

    await useCase.execute(5, 1);

    expect(repository.delete).toHaveBeenCalledWith(5);
  });
});
