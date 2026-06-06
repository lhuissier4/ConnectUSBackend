export class InvalidConversationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidConversationException';
  }
}
