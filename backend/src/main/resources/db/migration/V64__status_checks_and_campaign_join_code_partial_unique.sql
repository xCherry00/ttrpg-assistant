DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_campaigns_status'
    ) THEN
        ALTER TABLE campaigns
            ADD CONSTRAINT chk_campaigns_status
            CHECK (lower(status) IN ('active', 'finished', 'archived'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_campaign_sessions_status'
    ) THEN
        ALTER TABLE campaign_sessions
            ADD CONSTRAINT chk_campaign_sessions_status
            CHECK (upper(status) IN ('PLANNED', 'ACTIVE', 'FINISHED'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_player_characters_status'
    ) THEN
        ALTER TABLE player_characters
            ADD CONSTRAINT chk_player_characters_status
            CHECK (upper(status) IN ('DRAFT', 'ACTIVE', 'RETIRED'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_friend_requests_status'
    ) THEN
        ALTER TABLE friend_requests
            ADD CONSTRAINT chk_friend_requests_status
            CHECK (upper(status) IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED'));
    END IF;
END $$;

DROP INDEX IF EXISTS ux_campaigns_join_code;

CREATE UNIQUE INDEX IF NOT EXISTS ux_campaigns_join_code_active
    ON campaigns(join_code)
    WHERE deleted_at IS NULL;
