import { CallStatus } from '../enums/call-status.enum';

export class InvalidCallStateTransitionException extends Error {
  constructor(from: CallStatus, to: CallStatus) {
    super(`Transition d'appel invalide : ${from} → ${to}.`);
    this.name = 'InvalidCallStateTransitionException';
  }
}
