export class MessageNotFoundException extends Error {
  constructor(id: number) {
    super(`Aucun message trouvé avec l'identifiant ${id}.`);
    this.name = 'MessageNotFoundException';
  }
}
