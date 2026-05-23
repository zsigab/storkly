ALTER TABLE event_time_slot DROP COLUMN label;
ALTER TABLE event_time_slot ADD COLUMN slot_time TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE event_time_slot ALTER COLUMN slot_time DROP DEFAULT;
