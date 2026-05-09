-- Make registry_id nullable so system-wide categories can exist without a registry owner.
ALTER TABLE category ALTER COLUMN registry_id DROP NOT NULL;

-- Flag to distinguish global system categories from per-registry custom ones.
ALTER TABLE category ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed the 11 default baby-registry categories, but only if none exist yet.
INSERT INTO category (id, registry_id, name, sort_order, is_system, is_default)
SELECT gen_random_uuid(), NULL, name, sort_order, TRUE, is_default
FROM (VALUES
    ('Nursery & Sleep',   0, FALSE),
    ('Feeding',           1, FALSE),
    ('Diapering',         2, FALSE),
    ('Bath & Skincare',   3, FALSE),
    ('Clothing & Shoes',  4, FALSE),
    ('Gear & Travel',     5, FALSE),
    ('Toys & Play',       6, FALSE),
    ('Health & Safety',   7, FALSE),
    ('Books & Media',     8, FALSE),
    ('Postpartum',        9, FALSE),
    ('Miscellaneous',    10, TRUE)
) AS t(name, sort_order, is_default)
WHERE NOT EXISTS (SELECT 1 FROM category WHERE is_system = TRUE);
