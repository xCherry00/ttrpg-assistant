ALTER TABLE player_characters
ADD COLUMN IF NOT EXISTS sheet_json JSONB;
