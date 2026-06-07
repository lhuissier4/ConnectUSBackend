/**
 * Carte publique d'un utilisateur : identité minimale exposable au client
 * (login, résolution de nom). Ne contient aucune donnée sensible.
 */
export class UserCardDto {
  constructor(
    public readonly id: number,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}
}
