-- ─── Registry private fields ───────────────────────────────────────────────────

ALTER TABLE registry
    ADD COLUMN shipping_address TEXT,
    ADD COLUMN payment_details  TEXT;
