export class InvalidCallException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCallException';
  }
}
