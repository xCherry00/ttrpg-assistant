ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(60),
  ADD COLUMN IF NOT EXISTS tag_code INT,
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS favorite_system VARCHAR(60) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN IF NOT EXISTS friends_visibility VARCHAR(20) NOT NULL DEFAULT 'FRIENDS_ONLY',
  ADD COLUMN IF NOT EXISTS activity_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE users
SET username = lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE username IS NULL OR trim(username) = '';

UPDATE users
SET username = concat('user-', id)
WHERE username IS NULL OR trim(username) = '' OR username = '-';

UPDATE users
SET tag_code = 1000 + (id % 9000)
WHERE tag_code IS NULL;

ALTER TABLE users
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN tag_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_tag
ON users(username, tag_code);

CREATE INDEX IF NOT EXISTS idx_users_username_lower
ON users((lower(username)));

CREATE INDEX IF NOT EXISTS idx_users_display_name_lower
ON users((lower(display_name)));

CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGSERIAL PRIMARY KEY,
  sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT chk_friend_requests_users CHECK (sender_user_id <> receiver_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status
ON friend_requests(receiver_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status
ON friend_requests(sender_user_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_friend_requests_pending_pair
ON friend_requests(sender_user_id, receiver_user_id, status);

CREATE TABLE IF NOT EXISTS friendships (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_user_id),
  CONSTRAINT chk_friendships_users CHECK (user_id <> friend_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_friend_user
ON friendships(friend_user_id);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CONSTRAINT chk_user_blocks_users CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
ON user_blocks(blocked_user_id);
