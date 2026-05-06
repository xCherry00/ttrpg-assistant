CREATE TABLE IF NOT EXISTS user_campaign_favorites (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_user_campaign_favorites_user_created
ON user_campaign_favorites(user_id, created_at DESC);
