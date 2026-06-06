import { ConversationEntity } from './conversation.entity';
import { InvalidConversationException } from '../exceptions/invalid-conversation.exception';

const makeConversation = (a: number, b: number): ConversationEntity =>
  new ConversationEntity(1, a, b, new Date(), new Date());

describe('ConversationEntity', () => {
  it('refuse une conversation avec un seul et même participant', () => {
    expect(() => makeConversation(5, 5)).toThrow(InvalidConversationException);
  });

  it('refuse une paire non ordonnée (a > b)', () => {
    expect(() => makeConversation(8, 3)).toThrow(InvalidConversationException);
  });

  it('accepte une paire ordonnée (a < b)', () => {
    expect(() => makeConversation(3, 8)).not.toThrow();
  });

  describe('normalizePair', () => {
    it('ordonne la paire (min, max)', () => {
      expect(ConversationEntity.normalizePair(8, 3)).toEqual([3, 8]);
      expect(ConversationEntity.normalizePair(3, 8)).toEqual([3, 8]);
    });

    it('refuse une paire identique (conversation avec soi-même)', () => {
      expect(() => ConversationEntity.normalizePair(7, 7)).toThrow(
        InvalidConversationException,
      );
    });
  });

  describe('hasParticipant / otherParticipant', () => {
    const conversation = makeConversation(3, 8);

    it('hasParticipant true pour chaque participant, false sinon', () => {
      expect(conversation.hasParticipant(3)).toBe(true);
      expect(conversation.hasParticipant(8)).toBe(true);
      expect(conversation.hasParticipant(99)).toBe(false);
    });

    it("otherParticipant renvoie l'autre participant vis-à-vis de l'appelant", () => {
      expect(conversation.otherParticipant(3)).toBe(8);
      expect(conversation.otherParticipant(8)).toBe(3);
    });
  });
});
