/**
 * Port de sortie : récupération du nom d'affichage d'un utilisateur, utilisé
 * pour enrichir la notification `call:incoming` (callerName). Découple call de
 * la feature user via un adaptateur interrogeant la table user_accounts.
 */
export interface IUserLookup {
  /** Nom d'affichage (prénom + nom) de l'utilisateur, ou null s'il n'existe pas. */
  findDisplayName(userId: number): Promise<string | null>;
}

export const USER_LOOKUP_PORT = Symbol('ICallUserLookup');
