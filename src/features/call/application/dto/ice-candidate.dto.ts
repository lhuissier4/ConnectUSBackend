/**
 * Charge utile de l'event de signalisation `signal:ice`. Le backend relaie le
 * candidat ICE entre les deux pairs sans l'interpréter.
 */
export class IceCandidateDto {
  constructor(
    public readonly callId: number,
    public readonly candidate: unknown,
  ) {}
}
