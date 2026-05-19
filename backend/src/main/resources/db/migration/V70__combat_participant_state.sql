ALTER TABLE combat_participants
    ADD COLUMN IF NOT EXISTS max_hp INT NULL,
    ADD COLUMN IF NOT EXISTS current_hp INT NULL,
    ADD COLUMN IF NOT EXISTS temp_hp INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS armor_class INT NULL,
    ADD COLUMN IF NOT EXISTS conditions TEXT NULL,
    ADD COLUMN IF NOT EXISTS death_save_successes INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS death_save_failures INT NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_participants_max_hp') THEN
        ALTER TABLE combat_participants
            ADD CONSTRAINT chk_combat_participants_max_hp
            CHECK (max_hp IS NULL OR max_hp >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_participants_current_hp') THEN
        ALTER TABLE combat_participants
            ADD CONSTRAINT chk_combat_participants_current_hp
            CHECK (current_hp IS NULL OR current_hp >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_participants_temp_hp') THEN
        ALTER TABLE combat_participants
            ADD CONSTRAINT chk_combat_participants_temp_hp
            CHECK (temp_hp >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_participants_armor_class') THEN
        ALTER TABLE combat_participants
            ADD CONSTRAINT chk_combat_participants_armor_class
            CHECK (armor_class IS NULL OR armor_class >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_participants_death_save_successes') THEN
        ALTER TABLE combat_participants
            ADD CONSTRAINT chk_combat_participants_death_save_successes
            CHECK (death_save_successes BETWEEN 0 AND 3);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_combat_participants_death_save_failures') THEN
        ALTER TABLE combat_participants
            ADD CONSTRAINT chk_combat_participants_death_save_failures
            CHECK (death_save_failures BETWEEN 0 AND 3);
    END IF;
END $$;
