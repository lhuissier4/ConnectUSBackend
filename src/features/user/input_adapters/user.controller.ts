import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserExceptionFilter } from './filters/user-exception.filter';
import { UserService } from './user.service';

@UseFilters(new UserExceptionFilter())
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('search')
  getUserByName(
    @Query('firstName') firstName: string,
    @Query('lastName') lastName: string,
  ) {
    return this.userService.getUserByName(firstName, lastName);
  }

  @Get(':id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Post()
  createUser(
    @Body() dto: CreateUserDto,
    @Headers('x-requesting-user-id') requestingUserId: string,
  ) {
    return this.userService.createUser(dto, Number(requestingUserId));
  }

  @Delete(':id')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-requesting-user-id') requestingUserId: string,
  ) {
    return this.userService.deleteUser(id, Number(requestingUserId));
  }
}
