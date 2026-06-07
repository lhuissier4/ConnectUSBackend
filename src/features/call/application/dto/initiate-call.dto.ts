import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { CallType } from '../../domain/enums/call-type.enum';

/** Charge utile de l'event `call:initiate`. */
export class InitiateCallDto {
  @IsInt()
  @IsPositive()
  conversationId: number;

  @IsEnum(CallType)
  type: CallType;

  constructor(conversationId: number, type: CallType) {
    this.conversationId = conversationId;
    this.type = type;
  }
}
