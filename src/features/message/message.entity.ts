export class MessageEntity {
  constructor(
    public readonly id: string,
    public readonly channelId: string,
    public readonly authorId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    private content?: string,
    private attachments?: Array<any>,
    public readonly responseToMessageId?: string,
  ) {
    this.validate();
  }

  private validate() {
    if (!this.content && !this.attachments) {
      throw new Error('Message vide interdit');
    }
  }

  editContent(newContent: string) {
    if (!newContent) {
      throw new Error('Contenu invalide');
    }
    this.content = newContent;
    this.updatedAt = new Date();
  }

  addAttachment(file: any) {
    if (this.attachments) {
      this.attachments.push(file);
      this.updatedAt = new Date();
    }
  }

  getContent() {
    return this.content;
  }

  getAttachments() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.attachments;
  }
  // TODO: ajouter dropAttachement
}
