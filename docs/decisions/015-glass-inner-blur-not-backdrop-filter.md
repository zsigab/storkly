# ADR-015: Glass cards use an inner `filter: blur` layer, not `backdrop-filter`

**Status:** Accepted
**Date:** 2026-05-17

---

## Context

ADR-013 introduced the glass style using `backdrop-filter: blur(16px) saturate(180%)`
on `.bg-card` / `.bg-popover`. This works statically across browsers, but breaks
*during* CSS View Transitions on Firefox desktop and mobile Chrome: the glass
effect visibly disappears for the duration of the animation. Chromium desktop
is unaffected.

Root cause: during a view transition, the browser captures snapshots of the live
DOM into `::view-transition-*` pseudo-elements rooted at `:root`. `backdrop-filter`
samples pixels painted behind the element. The page's fixed bg layer
(`Layout.tsx` div with `bgStyle`) is either not included in the snapshot paint,
or is unreachable across the new stacking context the view-transition tree
creates. Either way, the blur sources transparent and the card looks like a
plain translucent rectangle.

We discovered this earlier with `GlassCardLayout` (which has its own
`view-transition-name`) and worked around it locally by embedding a
`filter: blur` div inside the captured element, then suppressing `backdrop-filter`
via `[data-glass-layout]`. The bug recurred for every other glass surface that
either got pulled into its own snapshot (named transitions on dialogs,
RegistryHeader links) or fell into the root snapshot on engines that don't
capture the fixed bg layer.

---

## Decision

Drop `backdrop-filter` entirely in glass mode. Every `.bg-card` / `.bg-popover`
gets a `::before` pseudo-element that paints its own blurred copy of the theme
background, captured into the view-transition snapshot along with the card.

```css
[data-style="glass"] .bg-card,
[data-style="glass"] .bg-popover {
  position: relative;
  isolation: isolate;
  overflow: clip;
  /* + translucent fill, noise texture, border, shadow as before */
}

[data-style="glass"] .bg-card::before,
[data-style="glass"] .bg-popover::before {
  content: "";
  position: absolute;
  inset: -10%;
  z-index: -1;
  background-image: var(--bg-image, none);
  background-size: var(--bg-size, auto);
  background-position: var(--bg-position, 0 0);
  background-attachment: fixed;
  filter: blur(16px) saturate(180%);
  pointer-events: none;
}
```

`ThemeProvider` mirrors `bgStyle` into `--bg-image / --bg-size / --bg-position`
custom properties on `<html>` so the pseudo-element can read the same theme bg
the `Layout` div paints. `background-attachment: fixed` keeps the blur source
viewport-aligned, matching the fixed bg layer.

`overflow: clip` clips the `-10%` inset (and the blur it carries) to the card's
own rounded box, without creating a scroll container or BFC the way
`overflow: hidden` would.

`GlassCardLayout` is simplified — the manual capture div and `data-glass-layout`
hook are removed, since cards now self-capture.

---

## Alternatives Considered

**Keep `backdrop-filter`, move the bg layer inside `<main>`** — would put the
fixed bg in the root snapshot for some cases, but elements with their own
`view-transition-name` are still pulled out of the root and would still lose
the source. Doesn't solve the named-transition case.

**Strip `view-transition-name` from affected elements** — kills the named
transitions we deliberately added (RegistryHeader links, GlassCardLayout edit
page grow). Not acceptable.

**Per-component `GlassCard` wrapper** — pushes the workaround into every
consumer instead of fixing it once at the `.bg-card` selector level. More
boilerplate, easier to forget.

---

## Consequences

- One consistent mechanism — glass looks the same across all browsers, including
  during view transitions.
- `overflow: clip` on every glass surface means popovers/dropdowns/cards cannot
  visually overflow their own box. Acceptable because Radix popovers, dialogs,
  and tooltips render via portal at the body level, not as children of cards.
- Each glass surface now paints `background-attachment: fixed` + `filter: blur`,
  which is heavier than a single `backdrop-filter`. On dense lists (many
  `ItemCard`s) this could cause jank on mobile; mitigation if it surfaces is to
  gate the `::before` behind a `data-glass-blur` attribute and apply only where
  needed during transitions.
- ADR-013's claim that glass is "implemented entirely in CSS using descendant
  selectors — no component code changes required" no longer holds: the theme
  hook now writes CSS variables on `<html>`. Component code is still unchanged.
