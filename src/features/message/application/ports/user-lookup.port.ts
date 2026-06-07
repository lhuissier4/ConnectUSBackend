/**
 * Port de sortie : accès minimal aux utilisateurs depuis la feature message.
 * Découple la feature message de la feature user : seuls l'existence et la
 * résolution de nom d'affichage sont exposés, réalisés par un adaptateur
 * interrogeant directement la table user_accounts.
 */
export interface IUserLookup {
  exists(userId: number): Promise<boolean>;
  /**
   * Résout les noms d'affichage (« Prénom Nom ») pour un lot d'ids.
   * Les ids absents en base ne figurent pas dans la map retournée.
   */
  getNames(ids: number[]): Promise<Map<number, string>>;
}

export const USER_LOOKUP_PORT = Symbol('IUserLookup');
