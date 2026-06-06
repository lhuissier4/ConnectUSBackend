export class NotAParticipantException extends Error {
  constructor(
    message = "L'utilisateur n'est pas participant de cette conversation.",
  ) {
    super(message);
    this.name = 'NotAParticipantException';
  }
}
