CREATE TYPE contributor_access AS ENUM ('ANYONE', 'AUTHENTICATED', 'INVITE_ONLY');

ALTER TABLE registry ADD COLUMN contributor_access contributor_access NOT NULL DEFAULT 'ANYONE';

UPDATE registry SET contributor_access = 'INVITE_ONLY' WHERE visibility = 'PRIVATE';
