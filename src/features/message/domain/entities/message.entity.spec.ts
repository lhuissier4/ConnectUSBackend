import { MessageEntity } from './message.entity';
import { InvalidMessageException } from '../exceptions/invalid-message.exception';

const makeMessage = (content: string): MessageEntity =>
  new MessageEntity(1, 42, 7, content, new Date(), new Date());

describe('MessageEntity', () => {
  it('refuse un contenu vide', () => {
    expect(() => makeMessage('')).toThrow(InvalidMessageException);
  });

  it("refuse un contenu uniquement composé d'espaces", () => {
    expect(() => makeMessage('   ')).toThrow(InvalidMessageException);
  });

  it('accepte un contenu non vide', () => {
    expect(() => makeMessage('salut')).not.toThrow();
  });

  it('conserve la réponse optionnelle', () => {
    const message = new MessageEntity(
      2,
      42,
      7,
      'réponse',
      new Date(),
      new Date(),
      1,
    );
    expect(message.responseToMessageId).toBe(1);
  });
});
