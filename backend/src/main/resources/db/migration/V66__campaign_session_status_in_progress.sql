UPDATE campaign_sessions
SET status = 'IN_PROGRESS'
WHERE upper(status) = 'ACTIVE';

ALTER TABLE campaign_sessions
DROP CONSTRAINT IF EXISTS chk_campaign_sessions_status;

ALTER TABLE campaign_sessions
    ADD CONSTRAINT chk_campaign_sessions_status
    CHECK (upper(status) IN ('PLANNED', 'IN_PROGRESS', 'FINISHED'));
