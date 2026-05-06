ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE';

UPDATE campaigns
SET visibility = 'PRIVATE'
WHERE visibility IS NULL OR trim(visibility) = '';

CREATE INDEX IF NOT EXISTS idx_campaigns_visibility_updated
ON campaigns(visibility, updated_at DESC);
