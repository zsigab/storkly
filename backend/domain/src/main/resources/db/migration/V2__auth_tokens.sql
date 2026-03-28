CREATE TABLE email_verification_token (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token       VARCHAR     NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_token (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token       VARCHAR     NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
