export class ConversationNotFoundException extends Error {
  constructor(id: number) {
    super(`Aucune conversation trouvée avec l'identifiant ${id}.`);
    this.name = 'ConversationNotFoundException';
  }
}
