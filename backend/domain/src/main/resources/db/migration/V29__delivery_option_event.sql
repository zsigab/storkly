-- Event-backed claim type: a delivery_option of type 'EVENT' references the event
-- at which the gift will be handed over. Deleting the event removes the claim type;
-- existing claims keep their delivery_type snapshot and have delivery_option_id set
-- to NULL via the claim → delivery_option FK (V13).
ALTER TABLE delivery_option
    ADD COLUMN event_id UUID REFERENCES "event"(id) ON DELETE CASCADE;
