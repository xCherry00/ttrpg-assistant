CREATE TABLE IF NOT EXISTS campaign_characters (
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    character_id BIGINT NOT NULL REFERENCES player_characters(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'PLAYER_CHARACTER',
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    removed_at TIMESTAMPTZ NULL
);

ALTER TABLE campaign_characters
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE campaign_characters
    ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'PLAYER_CHARACTER';

ALTER TABLE campaign_characters
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE campaign_characters
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE campaign_characters
    ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ NULL;

UPDATE campaign_characters cc
SET user_id = pc.owner_user_id
FROM player_characters pc
WHERE cc.character_id = pc.id
  AND cc.user_id IS NULL;

UPDATE campaign_characters
SET role = 'PLAYER_CHARACTER'
WHERE role IS NULL;

UPDATE campaign_characters
SET is_active = TRUE
WHERE is_active IS NULL;

UPDATE campaign_characters
SET assigned_at = COALESCE(assigned_at, now());

ALTER TABLE campaign_characters
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE campaign_characters
    ALTER COLUMN role SET NOT NULL;

ALTER TABLE campaign_characters
    ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE campaign_characters
    ALTER COLUMN assigned_at SET NOT NULL;

ALTER TABLE campaign_characters
    ADD CONSTRAINT ux_campaign_characters_campaign_character
    UNIQUE (campaign_id, character_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_campaign_characters_role'
    ) THEN
        ALTER TABLE campaign_characters
            ADD CONSTRAINT chk_campaign_characters_role
            CHECK (role IN ('PLAYER_CHARACTER', 'NPC', 'GUEST'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_characters_campaign_id
    ON campaign_characters(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_characters_character_id
    ON campaign_characters(character_id);

CREATE INDEX IF NOT EXISTS idx_campaign_characters_user_id
    ON campaign_characters(user_id);
