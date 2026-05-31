import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccountStatus, UserEntity } from '../entities/user.entity';
import { IUserRepository } from '../ports/output/user.repository.port';
import { DeleteUserUseCase } from './delete-user.usecase';

const makeUserEntity = (): UserEntity =>
  new UserEntity(
    5, 'Marie', 'Martin', 'marie@epsi.fr', 'hash',
    AccountStatus.ALUMNI, false, new Date(), new Date(),
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

  it("lève ForbiddenException si le demandeur n'est pas admin", async () => {
    repository.isAdmin.mockResolvedValue(false);

    await expect(useCase.execute(5, 99)).rejects.toThrow(ForbiddenException);
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("lève NotFoundException si l'utilisateur cible n'existe pas", async () => {
    repository.isAdmin.mockResolvedValue(true);
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999, 1)).rejects.toThrow(NotFoundException);
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
