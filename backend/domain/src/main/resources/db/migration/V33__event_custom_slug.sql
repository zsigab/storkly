-- ─── Event custom slugs ─────────────────────────────────────────────

CREATE TABLE event_custom_slug (
    slug        VARCHAR(50) NOT NULL PRIMARY KEY,
    event_id    UUID        NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX event_custom_slug_event_idx ON event_custom_slug(event_id);
