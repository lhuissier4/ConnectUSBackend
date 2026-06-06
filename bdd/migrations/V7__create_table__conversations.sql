CREATE TABLE conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Conversation directe 1-à-1. La paire est stockée ordonnée (a < b) pour
  -- garantir l'unicité quel que soit le sens de création.
  participant_a_id BIGINT NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,
  participant_b_id BIGINT NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT ordered_pair CHECK (participant_a_id < participant_b_id),
  CONSTRAINT unique_direct_conversation UNIQUE (participant_a_id, participant_b_id)
);

-- Recherche des conversations d'un utilisateur (il peut être a OU b).
CREATE INDEX idx_conversations_participant_a ON conversations (participant_a_id);
CREATE INDEX idx_conversations_participant_b ON conversations (participant_b_id);
