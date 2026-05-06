-- V10__campaign_join_codes_and_user_roles.sql
-- Campaign invite codes + user role normalization + MG flag.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_mg BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET role = 'PLAYER'
WHERE role = 'USER';

ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS system_code VARCHAR(32) NOT NULL DEFAULT 'dnd5e';

ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS join_code VARCHAR(20);

UPDATE campaigns
SET join_code = UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text || id::text), 1, 8))
WHERE join_code IS NULL OR join_code = '';

ALTER TABLE campaigns
    ALTER COLUMN join_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_campaigns_join_code
ON campaigns(join_code);

UPDATE users u
SET is_mg = TRUE
WHERE EXISTS (
    SELECT 1
    FROM campaigns c
    WHERE c.owner_user_id = u.id
);
