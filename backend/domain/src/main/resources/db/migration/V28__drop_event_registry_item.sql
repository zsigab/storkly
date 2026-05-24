-- The EVENT item type and its event↔item join table were removed in favour of an
-- event-backed claim type (delivery option). Drop the now-unused join table.
-- The unused 'EVENT' value on the item_type enum (added in V17) is left in place —
-- PostgreSQL cannot drop an enum value without recreating the type.
DROP TABLE IF EXISTS event_registry_item;
