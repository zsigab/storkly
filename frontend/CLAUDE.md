# Storkly Frontend — Agent Instructions

React 19 + Vite + TypeScript (strict) frontend.

---

## CRITICAL — Do NOT

- **No `any` type.** Use `unknown` and narrow.
- **No non-null assertions (`!`).** Handle null/undefined explicitly.
- **No `default export`.** Named exports only.
- **No `fetch` in components or hooks.** All API calls go through `src/api/` via TanStack Query hooks.
- **No hardcoded colour values.** Use Tailwind semantic tokens (`bg-background`, `text-foreground`, etc.). Never `bg-orange-50`.
- **No editing `src/components/ui/`.** Shadcn-generated — wrap/extend in `src/components/common/` or feature folders.
- **No additional UI libraries** (MUI, Chakra, Ant Design, etc.).
- **No CSS modules or styled-components.** Tailwind utility classes only.

---

## Stack

- **React 19**, **Vite**, **TypeScript** strict (`exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`)
- **Shadcn/UI** (Radix UI primitives) + **Tailwind CSS v4**
- **React Router v7** — client-side routing, `<RequireAuth>` for protected routes
- **TanStack Query v5** — all server state; invalidate on mutation success
- **openapi-typescript** — types hand-maintained in `src/api/schema.ts` until backend is stable
- **React Hook Form** + **Zod** — forms and validation
- **Vitest** + **React Testing Library** — tests

Note: `z.coerce.number()` returns `unknown` under `exactOptionalPropertyTypes` — use `z.string().refine()` + manual `parseInt` for numeric fields.

---

## Project Layout

```
frontend/src/
  api/              ← OpenAPI client + schema.ts (hand-maintained)
  components/
    ui/             ← Shadcn/UI (do not edit)
    common/         ← shared app components (Layout, Header, RequireAuth, …)
    registry/       ← registry feature components
  pages/            ← route-level pages (thin, compose components)
  hooks/            ← custom React hooks (useAuth, useRegistries, useItems, …)
  lib/utils.ts      ← cn() and pure utilities
  styles/globals.css ← Tailwind base + Storkly theme CSS variables
  router.tsx        ← React Router route definitions
```

---

## Tests

Every feature from Phase 1I onward requires tests. No exceptions.

- Query by role/label — no class names, no snapshots
- Test loading, success, and error states (mock `src/api/`, not `fetch`)
- Every page: at least one "renders expected content" test
- Every form: at least one "validates and submits" test
- Do not test Shadcn/UI primitives, pure layout/styling, or hook internals
