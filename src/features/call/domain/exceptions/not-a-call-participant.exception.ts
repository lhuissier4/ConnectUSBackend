export class NotACallParticipantException extends Error {
  constructor(message = "L'utilisateur n'est pas participant de cet appel.") {
    super(message);
    this.name = 'NotACallParticipantException';
  }
}
