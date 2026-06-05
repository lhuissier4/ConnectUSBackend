/**
 * Exception de domaine levée lorsqu'une invariante de l'entité utilisateur
 * n'est pas respectée à la construction (nom, e-mail, cohérence de la classe…).
 *
 * Le domaine ne dépend d'aucun framework : il signale les violations métier via
 * ses propres exceptions, charge aux adaptateurs d'entrée de les traduire en
 * réponses techniques (cf. UserExceptionFilter).
 */
export class InvalidUserException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserException';
  }
}
