import { MessageDto } from '../dto/message.dto';

/** Nom de l'event émis après persistance d'un message (consommé par la gateway WS). */
export const MESSAGE_CREATED_EVENT = 'message.created';

/** Charge utile de l'event de création de message. */
export class MessageCreatedEvent {
  constructor(
    public readonly conversationId: number,
    public readonly message: MessageDto,
  ) {}
}
