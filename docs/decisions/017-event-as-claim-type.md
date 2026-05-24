# ADR-017: Event as a Claim Type (delivery option), not an Item Type

**Status:** Accepted
**Date:** 2026-05-24

## Context

An earlier implementation modelled "events" at the item level: a third
`item_type` value `EVENT`, an `event_registry_item` join table, and RSVP-gated
visibility so an EVENT item only showed to confirmed attendees. This did not
match the intended feature. What was wanted: when a gifter **claims** an item,
they should be able to say "I'll buy this and bring it to your event."

That is a property of the *claim*, not the item. Storkly already models how a
gift is handed over with **delivery options** (the registry "Claim types"
section): each has a free-form `type` (`IN_PERSON`, `SHIP_TO_ADDRESS`,
`MONEY_TRANSFER`, `CUSTOM`) and a label shown to the claimer under "How will you
give this gift?".

## Decision

Add `EVENT` as a new delivery-option (claim) type, bound to one of the owner's
events.

1. `delivery_option` gains an `event_id UUID REFERENCES "event"(id) ON DELETE
   CASCADE` column (migration V29).
2. When the owner creates a claim type of type `EVENT`, the config UI replaces
   the free-text Label with a dropdown of the user's events (`GET /api/events`).
   The selected event's title becomes the label; the instructions are a
   read-only `"Handover at <event title>"`.
3. `DeliveryOptionService.save` enforces this server-side: `EVENT` requires an
   `eventId`, the event must belong to the current user, and label/description
   are derived from the event (client-supplied values are ignored). Non-`EVENT`
   types always have their `event_id` cleared.
4. Claiming needs no special handling — an `EVENT` option flows through the
   existing delivery-option selector and the claim records its `delivery_type`
   snapshot like any other type.

The old item-level feature is removed (see V28, which drops
`event_registry_item`).

## Trade-offs

**`ON DELETE CASCADE` for `event_id`.** Deleting an event removes any `EVENT`
claim type bound to it. Existing claims that used that option keep their
`delivery_type = "EVENT"` snapshot and have `delivery_option_id` set to NULL via
the pre-existing claim → delivery_option `ON DELETE SET NULL` (V13), so no claim
is destroyed. This is more lenient than `DeliveryOptionService.delete`, which
blocks removing an option that has claims — but the cascade degrades claims
gracefully rather than orphaning them, and "delete the event ⇒ its claim type
goes away" is the least surprising behaviour.

**Owner-bound, one event per claim type.** The owner picks the event when
creating the claim type, rather than the claimer picking at claim time. This
keeps the claimer flow unchanged and lets an owner expose exactly the events
they want as handover options (create several `EVENT` claim types for several
events).

**Leftover `EVENT` enum value.** The `item_type` Postgres enum still carries the
now-unused `EVENT` value from the old V17 migration; PostgreSQL cannot drop an
enum value without recreating the type. It is harmless and left in place.

## Consequences

- No schema churn on `claim`: the existing `delivery_type` snapshot already
  captures which kind of handover a claim used.
- Label/instructions for `EVENT` options are always consistent with the event,
  because the service derives them rather than trusting the client.
- `DeliveryOption` is now built with `@Builder(toBuilder = true)` so the service
  can derive a normalized copy.
