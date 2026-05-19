ALTER TABLE campaign_characters
    DROP CONSTRAINT IF EXISTS campaign_characters_character_id_fkey;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_campaign_characters_player_character'
    ) THEN
        ALTER TABLE campaign_characters
            ADD CONSTRAINT fk_campaign_characters_player_character
            FOREIGN KEY (character_id) REFERENCES player_characters(id) ON DELETE CASCADE;
    END IF;
END $$;
