import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ICallRepository } from '../application/ports/call.repository.port';
import { CALL_REPOSITORY_PORT } from '../application/ports/call.repository.port';

/**
 * À l'initialisation du module, termine les appels restés « en cours »
 * (RINGING / ACTIVE / MISSED) à la suite d'un redémarrage serveur : les
 * minuteries en mémoire ayant été perdues, ces appels ne pourraient plus
 * progresser et bloqueraient l'ouverture de nouveaux appels.
 */
@Injectable()
export class CallRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(CallRecoveryService.name);

  constructor(
    @Inject(CALL_REPOSITORY_PORT)
    private readonly callRepository: ICallRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const stale = await this.callRepository.findStale();
    if (stale.length === 0) {
      return;
    }
    for (const call of stale) {
      call.expireStale();
      await this.callRepository.update(call);
    }
    this.logger.log(
      `${stale.length} appel(s) resté(s) en cours expiré(s) au démarrage.`,
    );
  }
}
