import { NotFoundException } from '@nestjs/common';
import { AccountStatus, UserEntity } from '../entities/user.entity';
import { IUserRepository } from '../ports/output/user.repository.port';
import { GetUserByNameUseCase } from './get-user-by-name.usecase';

const makeUserEntity = (id = 1): UserEntity =>
  new UserEntity(
    id, 'Jean', 'Dupont', `jean${id}@epsi.fr`, 'hash',
    AccountStatus.TEACHER, false, new Date(), new Date(),
  );

describe('GetUserByNameUseCase', () => {
  let useCase: GetUserByNameUseCase;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      isAdmin: jest.fn(),
    };
    useCase = new GetUserByNameUseCase(repository);
  });

  it('retourne la liste des utilisateurs trouvés', async () => {
    const users = [makeUserEntity(1), makeUserEntity(2)];
    repository.findByName.mockResolvedValue(users);

    const result = await useCase.execute('Jean', 'Dupont');

    expect(result).toBe(users);
    expect(repository.findByName).toHaveBeenCalledWith('Jean', 'Dupont');
  });

  it("lève NotFoundException si aucun utilisateur n'est trouvé", async () => {
    repository.findByName.mockResolvedValue([]);

    await expect(useCase.execute('Inconnu', 'Inconnu')).rejects.toThrow(
      NotFoundException,
    );
  });
});
