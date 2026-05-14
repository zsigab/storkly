-- ─── Claim receive fields ──────────────────────────────────────────────────────

ALTER TABLE claim
    ADD COLUMN delivery_option_id UUID REFERENCES delivery_option(id) ON DELETE SET NULL,
    ADD COLUMN delivery_type     VARCHAR,
    ADD COLUMN received_at       TIMESTAMPTZ,
    ADD COLUMN amount_received   NUMERIC(12, 2);
