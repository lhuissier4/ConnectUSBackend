-- Grant admin access to Alice (granted by Bob)
INSERT INTO account_admin_accesses (account_id, granted_by)
SELECT
  alice.id,
  bob.id
FROM
  user_accounts alice,
  user_accounts bob
WHERE alice.email = 'alice.martin@connectus.fr'
  AND bob.email   = 'bob.dupont@connectus.fr';

-- Grant admin access to Bob (granted by Alice)
INSERT INTO account_admin_accesses (account_id, granted_by)
SELECT
  bob.id,
  alice.id
FROM
  user_accounts bob,
  user_accounts alice
WHERE bob.email   = 'bob.dupont@connectus.fr'
  AND alice.email = 'alice.martin@connectus.fr';
