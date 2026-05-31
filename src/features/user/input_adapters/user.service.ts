import { Injectable } from '@nestjs/common';
import { InputUserCommand } from '../domain/ports/input.user.command';
import { CreateUserUseCase } from '../domain/use-cases/create-user.usecase';
import { DeleteUserUseCase } from '../domain/use-cases/delete-user.usecase';
import { GetUserByIdUseCase } from '../domain/use-cases/get-user-by-id.usecase';
import { GetUserByNameUseCase } from '../domain/use-cases/get-user-by-name.usecase';
import { CreateUserDto } from './dto/create-user.dto';

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
    // L'adaptateur d'entrée traduit le DTO HTTP vers le port d'entrée du domaine.
    const command: InputUserCommand = {
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
    return this.createUserUseCase.execute(command, requestingUserId);
  }

  deleteUser(id: number, requestingUserId: number) {
    return this.deleteUserUseCase.execute(id, requestingUserId);
  }
}
