import { CallStatus } from '../../domain/enums/call-status.enum';
import { CallType } from '../../domain/enums/call-type.enum';
import { EndReason } from '../../domain/enums/end-reason.enum';

/** Représentation d'un appel exposée aux clients (REST et WebSocket). */
export class CallDto {
  constructor(
    public readonly id: number,
    public readonly conversationId: number,
    public readonly callerId: number,
    public readonly calleeId: number,
    public readonly status: CallStatus,
    public readonly type: CallType,
    public readonly startedAt: Date,
    public readonly answeredAt: Date | null,
    public readonly endedAt: Date | null,
    public readonly endReason: EndReason | null,
    /** Durée en secondes (answeredAt → endedAt), null si non décroché/non terminé. */
    public readonly duration: number | null,
  ) {}
}
