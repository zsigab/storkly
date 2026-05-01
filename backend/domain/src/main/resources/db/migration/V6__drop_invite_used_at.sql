ALTER TABLE registry_invite DROP COLUMN used_at;
ALTER TABLE registry_invite ADD CONSTRAINT registry_invite_registry_id_key UNIQUE (registry_id);
