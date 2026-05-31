CREATE TABLE account_admin_accesses (
  account_id BIGINT NOT NULL PRIMARY KEY,

  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,

  granted_by BIGINT,
  revoked_by BIGINT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_admin_access_account
    FOREIGN KEY (account_id)
    REFERENCES user_accounts(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_admin_access_granted_by
    FOREIGN KEY (granted_by)
    REFERENCES user_accounts(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_admin_access_revoked_by
    FOREIGN KEY (revoked_by)
    REFERENCES user_accounts(id)
    ON DELETE SET NULL,

  CONSTRAINT revoked_access_must_have_date
    CHECK (
      is_active = TRUE
      OR revoked_at IS NOT NULL
    ),
  CONSTRAINT admin_access_expiration_after_grant
    CHECK (
      expires_at IS NULL
      OR expires_at > granted_at
    ),

  CONSTRAINT admin_access_revocation_after_grant
    CHECK (
      revoked_at IS NULL
      OR revoked_at >= granted_at
    )
);