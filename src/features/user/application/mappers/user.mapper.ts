import { UserEntity } from '../../domain/entities/user.entity';
import { UserDto } from '../dto/user.dto';

/**
 * Mapper de la couche application : traduit entre le DTO d'entrée/sortie
 * (UserDto) et l'entité de domaine (UserEntity).
 *
 * Il appartient à la couche application — et non au domaine — car il dépend du
 * UserDto : la règle de dépendance hexagonale interdit au domaine de connaître
 * les contrats des couches externes.
 */
export class UserMapper {
  static user_entity_to_user_dto(user_entity: UserEntity): UserDto {
    return new UserDto(
      user_entity.firstName,
      user_entity.lastName,
      user_entity.email,
      user_entity.passwordHash,
      user_entity.statusInSchool,
      user_entity.isAdmin,
      user_entity.phoneNumber,
      user_entity.photoUrl,
      user_entity.rgpdPreferences,
      user_entity.currentCourse,
      user_entity.studentClass,
    );
  }

  static user_dto_to_user_entity(user_dto: UserDto): UserEntity {
    return new UserEntity(
      user_dto.firstName,
      user_dto.lastName,
      user_dto.email,
      user_dto.passwordHash,
      user_dto.statusInSchool,
      user_dto.isAdmin,
      user_dto.phoneNumber,
      user_dto.photoUrl,
      user_dto.rgpdPreferences,
      user_dto.currentCourse,
      user_dto.studentClass,
    );
  }
}
