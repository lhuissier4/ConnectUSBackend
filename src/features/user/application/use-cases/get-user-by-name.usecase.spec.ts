import { UserEntity } from '../../domain/entities/user.entity';
import { AccountStatus } from '../../domain/entities/account-status.enum';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../ports/user.repository.port';
import { GetUserByNameUseCase } from './get-user-by-name.usecase';

const makeUserEntity = (suffix = '1'): UserEntity =>
  new UserEntity(
    'Jean',
    'Dupont',
    `jean${suffix}@epsi.fr`,
    'hash',
    AccountStatus.TEACHER,
    false,
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
    const users = [makeUserEntity('1'), makeUserEntity('2')];
    repository.findByName.mockResolvedValue(users);

    const result = await useCase.execute('Jean', 'Dupont');

    expect(result).toBe(users);
    expect(repository.findByName).toHaveBeenCalledWith('Jean', 'Dupont');
  });

  it("lève UserNotFoundException si aucun utilisateur n'est trouvé", async () => {
    repository.findByName.mockResolvedValue([]);

    await expect(useCase.execute('Inconnu', 'Inconnu')).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
