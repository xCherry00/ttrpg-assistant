CREATE TABLE IF NOT EXISTS combat_encounters (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    session_id BIGINT NULL REFERENCES campaign_sessions(id) ON DELETE SET NULL,
    name VARCHAR(160) NOT NULL,
    system_code VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    current_turn_index INT NOT NULL DEFAULT 0,
    round_number INT NOT NULL DEFAULT 1,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_encounters_status'
    ) THEN
        ALTER TABLE combat_encounters
            ADD CONSTRAINT chk_combat_encounters_status
            CHECK (status IN ('ACTIVE', 'FINISHED', 'ARCHIVED'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_combat_encounters_campaign_id ON combat_encounters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_combat_encounters_session_id ON combat_encounters(session_id);

CREATE TABLE IF NOT EXISTS combat_participants (
    id BIGSERIAL PRIMARY KEY,
    encounter_id BIGINT NOT NULL REFERENCES combat_encounters(id) ON DELETE CASCADE,
    character_id BIGINT NULL REFERENCES player_characters(id) ON DELETE SET NULL,
    name VARCHAR(160) NOT NULL,
    participant_type VARCHAR(30) NOT NULL,
    initiative_value INT NOT NULL,
    initiative_modifier INT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_defeated BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_participants_type'
    ) THEN
        ALTER TABLE combat_participants
            ADD CONSTRAINT chk_combat_participants_type
            CHECK (participant_type IN ('PLAYER_CHARACTER', 'NPC', 'MONSTER', 'CUSTOM'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_combat_participants_encounter_id ON combat_participants(encounter_id);
CREATE INDEX IF NOT EXISTS idx_combat_participants_character_id ON combat_participants(character_id);
