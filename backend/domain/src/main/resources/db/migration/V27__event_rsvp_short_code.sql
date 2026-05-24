ALTER TABLE "event" ADD COLUMN rsvp_short_code VARCHAR(8) UNIQUE;

CREATE INDEX event_rsvp_short_code_idx ON "event"(rsvp_short_code);
