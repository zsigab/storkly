# ADR-013: Multi-Dimension Theming (Color Accent × Style × Mode)

**Status:** Accepted  
**Date:** 2026-05-09

---

## Context

The initial Storkly theme was a single peach palette with a light/dark toggle
(`storkly-minimal-light` / `storkly-minimal-dark`). The product needs broader
personalisation to suit different use-cases — particularly baby registries where
blue/pink gender-colour conventions are common — and an alternative glass-morphism
visual style.

---

## Decision

Introduce two orthogonal theme dimensions on top of the existing light/dark mode:

| Dimension | Values | Storage key |
|---|---|---|
| Color accent | `peach`, `blue`, `pink`, `green`, `purple` | `data-color` on `<html>` |
| Style | `minimal`, `glass` | `data-style` on `<html>` |
| Mode | `light`, `dark` | `.dark` class on `<html>` |

All three are persisted together as JSON under `localStorage["storkly-theme"]`.

The complete set of named variants is therefore:

```
storkly-{color}-minimal-light   (e.g. storkly-peach-minimal-light)
storkly-{color}-minimal-dark
storkly-{color}-glass-light
storkly-{color}-glass-dark
```

---

## Implementation

### CSS (globals.css)

Color accents are implemented as CSS custom-property overrides using attribute
selectors with the same specificity as the existing `:root` / `.dark` rules:

```css
[data-color="blue"]      { --primary: 217 91% 60%; --ring: 217 91% 60%; ... }
[data-color="blue"].dark { --primary: 217 85% 70%; --ring: 217 85% 70%; ... }
```

Each color accent also subtly shifts the `--background`, `--secondary`,
`--muted`, `--border`, and `--input` hues for ambient cohesion.

The glass style is implemented entirely in CSS using descendant selectors —
no component code changes required:

```css
/* gradient background on the html element */
[data-style="glass"] { background: linear-gradient(...) fixed; }

/* strip solid fills so the gradient shows through */
[data-style="glass"] body           { background-color: transparent; }
[data-style="glass"] .bg-background { background-color: transparent; }

/* frosted-glass cards */
[data-style="glass"] .bg-card {
  background: hsl(var(--card) / var(--glass-card-alpha));
  backdrop-filter: blur(14px) saturate(160%);
}
```

The `--glass-card-alpha` token is `0.78` in light mode and `0.38` in dark mode,
set on `:root` and `.dark` respectively.

The gradient uses `hsl(var(--primary) / 0.18)` for its accent endpoint, so
switching color accents automatically re-colours the glass gradient without any
additional rules.

### Hook (useTheme.ts)

`ThemeState` expands from a single `Theme` union to a record of all three
dimensions. The context exposes `setColor`, `setStyle`, and `toggleMode`.
`getInitialTheme` reads the stored JSON and falls back to
`{ color: "peach", style: "minimal", mode: <OS preference> }`.

### UI (ThemeSelector.tsx)

Replaces `ThemeToggle`. A `Palette` icon button opens a Shadcn `Popover`
containing three sections: color swatches, style toggle buttons, and a
light/dark mode toggle.

---

## Alternatives Considered

**CSS classes instead of `data-*` attributes** — rejected; attribute selectors
have identical specificity to class selectors (0-1-0) and are semantically
cleaner for non-state decoration.

**Tailwind `dark:` and custom variants** — Tailwind v4 dark variant is driven by
the `.dark` class on `<html>`, which we already use. Adding color-variant
utilities would require generating a combinatorial explosion of utility classes.
CSS custom properties via attribute selectors are simpler and more maintainable.

**Storing style separately from existing theme key** — rejected; a single JSON
blob under `"storkly-theme"` is simpler than multiple keys and fails gracefully
(invalid JSON → defaults).

---

## Consequences

- 20 named theme combinations (5 colors × 2 styles × 2 modes) with no per-component changes
- Adding a new color accent requires one `[data-color="X"]` + `[data-color="X"].dark` block in globals.css only
- `ThemeToggle` component removed; `ThemeSelector` is the single entry point
- Existing tests updated; new tests cover all three dimensions
