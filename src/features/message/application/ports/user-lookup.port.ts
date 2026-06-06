/**
 * Port de sortie : vérification minimale de l'existence d'un utilisateur.
 * Découple la feature message de la feature user : seul `exists` est exposé,
 * réalisé par un adaptateur interrogeant la table user_accounts.
 */
export interface IUserLookup {
  exists(userId: number): Promise<boolean>;
}

export const USER_LOOKUP_PORT = Symbol('IUserLookup');
