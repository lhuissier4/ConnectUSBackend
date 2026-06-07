export class CallAlreadyInProgressException extends Error {
  constructor(message = 'Un appel est déjà en cours pour cette conversation.') {
    super(message);
    this.name = 'CallAlreadyInProgressException';
  }
}
