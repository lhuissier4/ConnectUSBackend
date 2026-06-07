/**
 * Charge utile des events de signalisation WebRTC porteurs d'un SDP
 * (`signal:offer`, `signal:answer`). Le backend relaie le SDP sans l'interpréter.
 */
export class SignalDto {
  constructor(
    public readonly callId: number,
    public readonly sdp: unknown,
  ) {}
}
