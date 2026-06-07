import { MessageDto } from './message.dto';

export class ConversationDto {
  constructor(
    public readonly id: number,
    public readonly otherParticipantId: number,
    public readonly otherParticipantName: string,
    public readonly lastMessage: MessageDto | null = null,
  ) {}
}
