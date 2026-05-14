ALTER TABLE claim ADD COLUMN confirmed_at TIMESTAMPTZ;

-- Existing authenticated claims are implicitly confirmed at claim time
UPDATE claim SET confirmed_at = claimed_at WHERE claimer_user_id IS NOT NULL;
