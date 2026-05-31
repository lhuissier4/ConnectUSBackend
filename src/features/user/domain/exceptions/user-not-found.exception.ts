export class UserNotFoundException extends Error {
  constructor(id: number) {
    super(`Aucun utilisateur trouvé avec l'identifiant ${id}.`);
    this.name = 'UserNotFoundException';
  }
}
