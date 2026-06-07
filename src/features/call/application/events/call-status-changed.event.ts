import { CallStatus } from '../../domain/enums/call-status.enum';
import { CallDto } from '../dto/call.dto';

/** Nom de l'event émis après chaque changement d'état d'un appel. */
export const CALL_STATUS_CHANGED_EVENT = 'call.status-changed';

/** Charge utile de l'event de changement d'état d'un appel. */
export class CallStatusChangedEvent {
  constructor(
    public readonly call: CallDto,
    /** Statut avant transition, null pour une création (RINGING initial). */
    public readonly previousStatus: CallStatus | null,
  ) {}
}
