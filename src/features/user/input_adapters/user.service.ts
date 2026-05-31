import { Injectable } from '@nestjs/common';
import { CreateUserPayload } from '../domain/ports/output/user.repository.port';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserUseCase } from '../domain/use-cases/create-user.usecase';
import { DeleteUserUseCase } from '../domain/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from '../domain/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from '../domain/use-cases/get-user-by-name.usecase';

@Injectable()
export class UserService {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUserByNameUseCase: GetUserByNameUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  getUserById(id: number) {
    return this.getUserByIdUseCase.execute(id);
  }

  getUserByName(firstName: string, lastName: string) {
    return this.getUserByNameUseCase.execute(firstName, lastName);
  }

  createUser(dto: CreateUserDto, requestingUserId: number) {
    const payload: CreateUserPayload = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash: dto.passwordHash,
      status: dto.status,
      isAdmin: dto.isAdmin,
      phoneNumber: dto.phoneNumber,
      photoUrl: dto.photoUrl,
      rgpdPreferences: dto.rgpdPreferences,
      currentCourse: dto.currentCourse,
      studentClass: dto.studentClass,
    };
    return this.createUserUseCase.execute(payload, requestingUserId);
  }

  deleteUser(id: number, requestingUserId: number) {
    return this.deleteUserUseCase.execute(id, requestingUserId);
  }
}
