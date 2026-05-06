CREATE TABLE IF NOT EXISTS dm_conversations (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'DIRECT',
  direct_key VARCHAR(80),
  title VARCHAR(180) NOT NULL DEFAULT '',
  created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_preview VARCHAR(280) NOT NULL DEFAULT '',
  last_message_sender_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_dm_conversations_direct_key
ON dm_conversations(direct_key)
WHERE direct_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message
ON dm_conversations(last_message_at DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS dm_conversation_members (
  conversation_id BIGINT NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  muted BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_message_id BIGINT,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_members_user_status
ON dm_conversation_members(user_id, status, joined_at DESC);

CREATE TABLE IF NOT EXISTS dm_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  attachment_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation
ON dm_messages(conversation_id, id DESC);

CREATE TABLE IF NOT EXISTS dm_message_attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  uploader_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_attachments_message
ON dm_message_attachments(message_id, id ASC);
