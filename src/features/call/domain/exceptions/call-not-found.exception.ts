export class CallNotFoundException extends Error {
  constructor(id: number) {
    super(`Aucun appel trouvé avec l'identifiant ${id}.`);
    this.name = 'CallNotFoundException';
  }
}
