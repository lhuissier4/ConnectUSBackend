CREATE TABLE calls (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Tout appel est rattaché à une conversation 1-à-1 existante : la paire de
  -- participants (et donc la validation d'appartenance) est portée par elle.
  conversation_id BIGINT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  caller_id BIGINT NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,
  callee_id BIGINT NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,

  status call_status NOT NULL DEFAULT 'RINGING',
  type call_type NOT NULL,

  -- Cycle de vie : started (création) → answered (décroché) → ended (raccroché).
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  end_reason end_reason,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Historique d'appels d'une conversation, trié du plus récent au plus ancien.
CREATE INDEX idx_calls_conversation_recent
  ON calls (conversation_id, created_at DESC);

-- Recherche de l'appel en cours d'une conversation (RINGING / ACTIVE / MISSED).
CREATE INDEX idx_calls_conversation_status
  ON calls (conversation_id, status);
