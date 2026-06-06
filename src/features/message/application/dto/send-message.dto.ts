import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  responseToMessageId?: number;

  constructor(content: string, responseToMessageId?: number) {
    this.content = content;
    this.responseToMessageId = responseToMessageId;
  }
}
