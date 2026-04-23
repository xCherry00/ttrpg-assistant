-- V11__campaign_cover_image.sql
-- Optional campaign cover image for campaign hub tiles.

ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
