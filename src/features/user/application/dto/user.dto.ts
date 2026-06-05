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
import { AccountStatus } from '../../domain/entities/account-status.enum';
import { StudentClass } from '../../domain/entities/student-class.enum';

export class UserDto {
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
  statusInSchool: AccountStatus;

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

  @ValidateIf((dto: UserDto) => dto.statusInSchool === AccountStatus.STUDENT)
  @IsEnum(StudentClass)
  @IsNotEmpty()
  studentClass?: StudentClass;

  constructor(
    firstName: string,
    lastName: string,
    email: string,
    passwordHash: string,
    statusInSchool: AccountStatus,
    isAdmin: boolean,
    phoneNumber?: string,
    photoUrl?: string,
    rgpdPreferences?: Record<string, unknown>,
    currentCourse?: string,
    studentClass?: StudentClass,
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.passwordHash = passwordHash;
    this.statusInSchool = statusInSchool;
    this.isAdmin = isAdmin;
    this.phoneNumber = phoneNumber;
    this.photoUrl = photoUrl;
    this.rgpdPreferences = rgpdPreferences;
    this.currentCourse = currentCourse;
    this.studentClass = studentClass;
  }
}
