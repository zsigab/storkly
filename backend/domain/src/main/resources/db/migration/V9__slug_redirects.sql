-- ─── Registry slug redirects ───────────────────────────────────────────────

CREATE TABLE registry_slug_redirect (
    old_slug    VARCHAR     NOT NULL PRIMARY KEY,
    registry_id UUID        NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX registry_slug_redirect_registry_idx ON registry_slug_redirect(registry_id);
