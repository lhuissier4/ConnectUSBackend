import { IsInt, IsPositive } from 'class-validator';

export class CreateConversationDto {
  @IsInt()
  @IsPositive()
  targetUserId: number;

  constructor(targetUserId: number) {
    this.targetUserId = targetUserId;
  }
}
