/** Vue minimale d'une conversation 1-à-1 pour la feature call. */
export interface ConversationParticipants {
  id: number;
  participantAId: number;
  participantBId: number;
}

/**
 * Port de sortie : consultation des conversations depuis la feature call.
 * Découple call de message : seuls la récupération d'une conversation et le
 * test d'appartenance sont exposés, réalisés par un adaptateur interrogeant la
 * table conversations.
 */
export interface IConversationLookup {
  findById(conversationId: number): Promise<ConversationParticipants | null>;

  hasParticipant(conversationId: number, userId: number): Promise<boolean>;
}

export const CONVERSATION_LOOKUP_PORT = Symbol('IConversationLookup');
