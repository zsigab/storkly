CREATE TABLE event_registry_link (
    event_id    UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    registry_id UUID NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, registry_id)
);

CREATE INDEX event_registry_link_event_idx ON event_registry_link(event_id);
