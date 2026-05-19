CREATE TABLE event_registry_item (
    event_id UUID NOT NULL REFERENCES "event"(id) ON DELETE CASCADE,
    item_id  UUID NOT NULL REFERENCES item(id)   ON DELETE CASCADE,
    PRIMARY KEY (event_id, item_id)
);
