-- 2B2: Extract OAuth provider identity to separate join table
-- Allows one user account to be linked to multiple OAuth providers (Google + Facebook)

CREATE TABLE user_oauth_provider (
    user_id     UUID            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    provider    auth_provider   NOT NULL,
    provider_id VARCHAR         NOT NULL,
    linked_at   TIMESTAMPTZ     NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, provider),
    UNIQUE (provider, provider_id)
);

-- Migrate existing OAuth provider identities from user table
INSERT INTO user_oauth_provider (user_id, provider, provider_id, linked_at)
SELECT id, provider, provider_id, created_at
FROM "user"
WHERE provider != 'LOCAL' AND provider_id IS NOT NULL;

-- Drop denormalized columns from user table
ALTER TABLE "user" DROP COLUMN provider;
ALTER TABLE "user" DROP COLUMN provider_id;
