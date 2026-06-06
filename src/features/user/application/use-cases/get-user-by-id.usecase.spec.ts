import { UserEntity } from '../../domain/entities/user.entity';
import { AccountStatus } from '../../domain/entities/account-status.enum';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../ports/user.repository.port';
import { GetUserByIdUseCase } from './get-user-by-id.usecase';

const makeUserEntity = (): UserEntity =>
  new UserEntity(
    'Jean',
    'Dupont',
    'jean@epsi.fr',
    'hash',
    AccountStatus.TEACHER,
    false,
  );

describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      isAdmin: jest.fn(),
    };
    useCase = new GetUserByIdUseCase(repository);
  });

  it("retourne l'utilisateur si trouvé", async () => {
    const user = makeUserEntity();
    repository.findById.mockResolvedValue(user);

    const result = await useCase.execute(1);

    expect(result).toBe(user);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it("lève UserNotFoundException si l'utilisateur n'existe pas", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(UserNotFoundException);
  });
});
