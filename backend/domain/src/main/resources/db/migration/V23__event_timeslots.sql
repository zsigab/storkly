CREATE TABLE event_time_slot (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id    UUID        NOT NULL REFERENCES "event"(id) ON DELETE CASCADE,
    label       TEXT        NOT NULL,
    capacity    INT         NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX event_time_slot_event_idx ON event_time_slot(event_id);

ALTER TABLE "event" ADD COLUMN rsvp_capacity INT NULL;
ALTER TABLE rsvp ADD COLUMN time_slot_id UUID NULL REFERENCES event_time_slot(id) ON DELETE SET NULL;
