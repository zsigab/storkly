CREATE TABLE "event" (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id    UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL,
    event_date  TIMESTAMPTZ NOT NULL,
    location    TEXT,
    rsvp_token  VARCHAR     UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX event_owner_idx ON "event"(owner_id);
