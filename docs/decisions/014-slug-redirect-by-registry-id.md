# ADR-014: Slug Redirect via Registry ID, Not Slug Chain

**Date:** 2026-05-09  
**Status:** Accepted

## Context

When a registry name is changed, the URL slug may change (e.g., `baby-registry` → `mikeys-registry`). Old bookmarked links or shared URLs should still work and resolve to the renamed registry.

Two approaches:
1. **Slug-to-slug mapping** (`old_slug` → `target_slug`): Direct in the database, but creates chains for multi-rename scenarios (slug1→slug2→slug3 requires chain-following on lookup).
2. **Slug-to-registry mapping** (`old_slug` → `registry_id`): Single-hop lookup, no chains.

## Decision

Implement slug redirects via `registry_id`, not target slug.

**Schema:**
```sql
CREATE TABLE registry_slug_redirect (
    old_slug    VARCHAR NOT NULL PRIMARY KEY,
    registry_id UUID    NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Lookup:** When an old slug is queried, the redirect table returns the `registry_id`, then we fetch the current registry to get its canonical slug. Single database hop.

## Rationale

- **No chain-following:** Old slug always resolves in O(1) to the registry, regardless of rename history.
- **Automatic multi-hop handling:** If a registry is renamed twice (slug1→slug2→slug3), both old slugs point to the same registry_id, so both resolve to slug3. No intermediate (slug1→slug2) entry needed.
- **Simpler garbage collection:** If old slugs need cleanup later, we simply delete old entries without worrying about downstream targets.
- **Cleaner semantics:** A redirect stores "old name for this registry," not "forward this name to that name."

## Alternatives Considered

- **Slug-to-slug chains:** Requires chain traversal logic and intermediate entry cleanup on rename.
- **API 301 Permanent Redirect:** Doesn't update browser URL in SPA context (fetch() follows silently), so still needs frontend navigation. Frontend redirect on slug mismatch is simpler.

## Consequences

- ✅ Simpler and faster lookup logic
- ✅ No chain-following complexity
- ✅ Automatic multi-hop support
- ✅ Foreign key cascade handles deletion
- ⚠️ Multiple old slugs can point to the same registry; garbage collection (if needed) must clean all

## Related

- Frontend: `RegistryPage.tsx` detects canonical slug mismatch and navigates to the new URL.
- Service: `RegistryService.resolveBySlug()` tries main table, then redirect table.
