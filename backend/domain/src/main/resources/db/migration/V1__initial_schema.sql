-- ─── Enum types ────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE auth_provider AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');
CREATE TYPE registry_visibility AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE source_site AS ENUM ('LAZADA_PH', 'SHOPEE_PH', 'AMAZON', 'GALAXUS', 'SM', 'ROBINSONS', 'MANUAL');
CREATE TYPE item_flag AS ENUM ('EXACT_ONLY', 'SIMILAR_OK', 'SIMILAR_CHEAPER');

-- ─── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE "user" (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR     NOT NULL UNIQUE,
    password_hash       TEXT,
    display_name        TEXT        NOT NULL,
    email_verified_at   TIMESTAMPTZ,
    provider            auth_provider NOT NULL DEFAULT 'LOCAL',
    provider_id         TEXT,
    role                user_role   NOT NULL DEFAULT 'USER',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Registries ────────────────────────────────────────────────────────────────

CREATE TABLE registry (
    id          UUID                NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id    UUID                NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name        TEXT                NOT NULL,
    slug        VARCHAR             NOT NULL UNIQUE,
    description TEXT,
    visibility  registry_visibility NOT NULL DEFAULT 'PUBLIC',
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX registry_owner_idx ON registry(owner_id);

-- ─── Registry co-owners ────────────────────────────────────────────────────────

CREATE TABLE registry_co_owner (
    registry_id UUID        NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES "user"(id)   ON DELETE CASCADE,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (registry_id, user_id)
);

-- ─── Registry invites ──────────────────────────────────────────────────────────

CREATE TABLE registry_invite (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_id UUID        NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    token       VARCHAR     NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at     TIMESTAMPTZ
);

-- ─── Registry subscriptions ────────────────────────────────────────────────────

CREATE TABLE registry_subscription (
    user_id     UUID        NOT NULL REFERENCES "user"(id)   ON DELETE CASCADE,
    registry_id UUID        NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, registry_id)
);

-- ─── Categories ────────────────────────────────────────────────────────────────

CREATE TABLE category (
    id          UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_id UUID    NOT NULL REFERENCES registry(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX category_registry_idx ON category(registry_id);

-- ─── Items ─────────────────────────────────────────────────────────────────────

CREATE TABLE item (
    id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_id       UUID        NOT NULL REFERENCES registry(id)   ON DELETE CASCADE,
    category_id       UUID        REFERENCES category(id)            ON DELETE SET NULL,
    added_by_user_id  UUID        REFERENCES "user"(id)              ON DELETE SET NULL,
    url_original      TEXT,
    source_site       source_site NOT NULL DEFAULT 'MANUAL',
    title             TEXT        NOT NULL,
    description       TEXT,
    image_url         TEXT,
    price_reference   NUMERIC(12, 2),
    currency          TEXT,
    price_captured_at TIMESTAMPTZ,
    quantity_desired  INTEGER     NOT NULL DEFAULT 1,
    flag              item_flag   NOT NULL DEFAULT 'EXACT_ONLY',
    notes             TEXT,
    sort_order        INTEGER     NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX item_registry_idx  ON item(registry_id);
CREATE INDEX item_category_idx  ON item(category_id);

-- ─── Item marketplace hits (Phase 2 schema — not used in Phase 1) ─────────────

CREATE TABLE item_marketplace_hit (
    id       UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id  UUID          NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    site     source_site   NOT NULL,
    url      TEXT          NOT NULL,
    price    NUMERIC(12, 2) NOT NULL,
    currency TEXT          NOT NULL,
    found_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX item_marketplace_hit_item_idx ON item_marketplace_hit(item_id);

-- ─── Claims ────────────────────────────────────────────────────────────────────

CREATE TABLE claim (
    id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id          UUID        NOT NULL REFERENCES item(id) ON DELETE CASCADE,
    claimer_user_id  UUID        REFERENCES "user"(id) ON DELETE SET NULL,
    claimer_name     TEXT        NOT NULL,
    claimer_email    TEXT        NOT NULL,
    quantity_claimed INTEGER     NOT NULL DEFAULT 1,
    claim_token      VARCHAR     NOT NULL UNIQUE,
    claimed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at      TIMESTAMPTZ
);

CREATE INDEX claim_item_idx ON claim(item_id);
