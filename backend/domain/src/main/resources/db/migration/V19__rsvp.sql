CREATE TABLE rsvp (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id            UUID        NOT NULL REFERENCES "event"(id) ON DELETE CASCADE,
    user_id             UUID        REFERENCES "user"(id) ON DELETE SET NULL,
    email               VARCHAR     NOT NULL,
    display_name        TEXT        NOT NULL,
    attending           BOOLEAN     NOT NULL,
    confirmation_token  VARCHAR     UNIQUE NOT NULL,
    confirmed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (event_id, email)
);

CREATE INDEX rsvp_event_idx ON rsvp(event_id);
