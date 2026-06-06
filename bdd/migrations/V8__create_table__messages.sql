CREATE TABLE messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  conversation_id BIGINT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  -- Réponse optionnelle à un autre message (de la même conversation, vérifié côté application).
  response_to_message_id BIGINT REFERENCES messages (id) ON DELETE SET NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Soutient la pagination par curseur : derniers messages + remontée du fil
-- (ORDER BY created_at, id) pour une conversation donnée.
CREATE INDEX idx_messages_conversation_cursor
  ON messages (conversation_id, created_at, id);
