-- ─── Delivery options ──────────────────────────────────────────────────────────

CREATE TABLE delivery_option (
    id          UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_id UUID    NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    type        VARCHAR NOT NULL,
    label       TEXT    NOT NULL,
    description TEXT,
    enabled     BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX delivery_option_registry_idx ON delivery_option(registry_id);
