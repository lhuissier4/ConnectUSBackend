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
} from '@nestjs/common';
import { type CreateUserPayload } from '../features/user/ports/user.repository.port';
import { UserService } from './user.service';

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
    @Body() payload: CreateUserPayload,
    @Headers('x-requesting-user-id') requestingUserId: string,
  ) {
    return this.userService.createUser(payload, Number(requestingUserId));
  }

  @Delete(':id')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-requesting-user-id') requestingUserId: string,
  ) {
    return this.userService.deleteUser(id, Number(requestingUserId));
  }
}
