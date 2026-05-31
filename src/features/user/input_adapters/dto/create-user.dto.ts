import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AccountStatus, StudentClass } from '../../domain/entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  passwordHash: string;

  @IsEnum(AccountStatus)
  status: AccountStatus;

  @IsBoolean()
  isAdmin: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsObject()
  rgpdPreferences?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  currentCourse?: string;

  @ValidateIf((dto: CreateUserDto) => dto.status === AccountStatus.STUDENT)
  @IsEnum(StudentClass)
  @IsNotEmpty()
  studentClass?: StudentClass;
}
