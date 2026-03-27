# Storkly Frontend — Agent Instructions

React 19 + Vite + TypeScript frontend for the Storkly gift registry application.

---

## CRITICAL — Do NOT

- **Do NOT use `any` type.** Use `unknown` and narrow. No escape hatches.
- **Do NOT use non-null assertions (`!`).** Handle null/undefined explicitly.
- **Do NOT use `default export`.** Named exports only — makes refactoring easier.
- **Do NOT call `fetch` directly in components.** All API calls go through the generated
  client in `src/api/` via TanStack Query hooks.
- **Do NOT hardcode colour values.** Always use Tailwind semantic tokens (`bg-background`,
  `text-foreground`, `text-primary`, etc.). Never `bg-orange-50` or `text-stone-800`.
- **Do NOT edit files in `src/components/ui/`.** These are Shadcn-generated. Wrap and
  extend them in `src/components/common/` or feature folders.
- **Do NOT install additional UI component libraries** (MUI, Chakra, Ant Design, etc.).
  Shadcn/UI + Tailwind is the only UI system.
- **Do NOT add features not in the current phase.** If working on Phase 1, do not add
  OAuth buttons, scraper UI, or any Phase 2 feature.
- **Do NOT skip Prettier.** Run `npx prettier --write src/` before every commit.
- **Do NOT use CSS modules or styled-components.** Tailwind utility classes only.
- **Do NOT create route-level components that directly contain business logic.** Pages compose
  feature components; feature components contain logic.

---

## Stack

- **React 19** — UI library
- **Vite** — build tool and dev server
- **TypeScript** (strict mode) — type safety throughout
- **Shadcn/UI** — component library built on Radix UI primitives
- **Tailwind CSS v4** — utility-first styling, CSS variable theming
- **React Router v7** — client-side routing
- **TanStack Query (React Query v5)** — server state, data fetching, caching
- **openapi-typescript** — generates types from Spring Boot's OpenAPI spec
- **Prettier** — code formatting (auto, no debate)
- **Zod** — runtime schema validation for forms
- **React Hook Form** — form state management, pairs with Zod

---

## Project Layout

```
frontend/
  src/
    api/              -- Generated OpenAPI client + typed fetch wrappers
    components/
      ui/             -- Shadcn/UI components (auto-generated, don't edit)
      common/         -- Shared app components (Layout, Header, ThemeToggle, ...)
      registry/       -- Registry-specific components
      item/           -- Item card, item form, claim dialog
      auth/           -- Login form, register form, etc.
    pages/            -- Route-level page components (thin, compose components)
    hooks/            -- Custom React hooks (useAuth, useRegistry, ...)
    lib/
      utils.ts        -- cn() helper and other pure utilities
      queryClient.ts  -- TanStack Query client singleton
    styles/
      globals.css     -- Tailwind base + Storkly theme CSS variables
    router.tsx        -- React Router route definitions
    main.tsx          -- Entry point
  public/
  index.html
  vite.config.ts
  tsconfig.json
  prettier.config.js
  .editorconfig
```

---

## TypeScript Style

### Strict mode is on — no escape hatches

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- No `any`. Use `unknown` and narrow it.
- No non-null assertions (`!`) — handle null/undefined explicitly.
- Prefer `interface` for object shapes, `type` for unions/aliases.

### Component conventions

```tsx
// Named exports only — no default exports (makes refactoring easier)
export function ItemCard({ item, onClaim }: ItemCardProps) {
  // ...
}

// Props interface defined above the component, not inline
interface ItemCardProps {
  item: ItemResponse;
  onClaim: (itemId: string) => void;
}
```

### File naming

- Components: `PascalCase.tsx` (e.g. `ItemCard.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g. `useRegistry.ts`)
- Utilities: `camelCase.ts` (e.g. `formatPrice.ts`)
- Pages: `PascalCase.tsx` in `pages/` (e.g. `RegistryPage.tsx`)

---

## Formatting — Prettier

Prettier handles all formatting automatically. No manual style decisions.

```js
// prettier.config.js
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  plugins: ["prettier-plugin-tailwindcss"],  // sorts Tailwind classes
};
```

Run before committing: `npx prettier --write src/`

The Tailwind plugin automatically sorts class names — do not manually reorder them.

---

## Data Fetching — TanStack Query

All server state goes through TanStack Query. No raw `fetch` calls in components.

```tsx
// hooks/useRegistry.ts
export function useRegistry(slug: string) {
  return useQuery({
    queryKey: ["registry", slug],
    queryFn: () => api.registries.getBySlug(slug),
  });
}

// Mutations always invalidate the relevant query on success
export function useClaimItem(registrySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ClaimCreateRequest) => api.claims.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registry", registrySlug] });
    },
  });
}
```

---

## API Client — Generated from OpenAPI

The backend exposes an OpenAPI spec at `/api/docs`. The frontend generates types from it:

```bash
npx openapi-typescript http://localhost:8080/api/docs -o src/api/schema.ts
```

A thin wrapper in `src/api/client.ts` adds auth headers, base URL, and error handling.
Never call `fetch` directly in components or hooks — always go through `src/api/`.

---

## Forms — React Hook Form + Zod

```tsx
const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  price: z.number().positive().optional(),
  flag: z.enum(["EXACT_ONLY", "SIMILAR_OK", "SIMILAR_CHEAPER"]),
});

type FormValues = z.infer<typeof schema>;

export function ItemForm({ onSubmit }: ItemFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { flag: "EXACT_ONLY" },
  });
  // ...
}
```

---

## Theming — Tailwind + Shadcn/UI

All colours are CSS custom properties in `src/styles/globals.css`.
Never hardcode colour values in components — always use semantic tokens via Tailwind.

```tsx
// Good — uses semantic token
<div className="bg-background text-foreground border-border rounded-lg" />

// Bad — hardcodes colour
<div className="bg-orange-50 text-stone-800" />
```

Dark mode is toggled by adding/removing the `dark` class on `<html>`.
The toggle is persisted in `localStorage` and respects `prefers-color-scheme` on first visit.

### Shadcn/UI components

Components in `src/components/ui/` are generated by the Shadcn CLI and should not be
edited directly. Wrap and extend them in `src/components/common/` or feature folders instead.

```tsx
// Don't edit: src/components/ui/button.tsx (Shadcn generated)

// Do extend: src/components/common/PrimaryButton.tsx
import { Button } from "@/components/ui/button";

export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="default" className="font-semibold" {...props}>
      {children}
    </Button>
  );
}
```

---

## Routing — React Router v7

```tsx
// router.tsx
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "r/:slug", element: <RegistryPage /> },
      { path: "r/:slug/edit", element: <EditRegistryPage /> },
    ],
  },
]);
```

Protected routes check auth state via a `<RequireAuth>` wrapper component.

---

## Error Handling

- API errors from TanStack Query surface via `error` state on `useQuery`/`useMutation`
- Use Shadcn's `<Alert>` component for inline errors, `<Toast>` (Sonner) for mutation feedback
- A React Error Boundary wraps the router for unexpected crashes

---

## Testing

- Component tests: Vitest + React Testing Library
- Focus on behaviour, not implementation (query by role/label, not class names)
- No snapshot tests

---

## Git Workflow

- Run `npx prettier --write src/` before every commit
- **Commit message format:**

```
Topic: concise summary

ADR-NNN: short decision summary (only when relevant)
```

- Push each commit to the remote
- Do not batch unrelated changes into one commit
