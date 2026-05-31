export class InsufficientPermissionsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientPermissionsException';
  }
}
