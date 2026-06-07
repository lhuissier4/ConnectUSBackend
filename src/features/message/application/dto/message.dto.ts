export class MessageDto {
  constructor(
    public readonly id: number,
    public readonly conversationId: number,
    public readonly authorId: number,
    public readonly authorName: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly responseToMessageId: number | null = null,
  ) {}
}
