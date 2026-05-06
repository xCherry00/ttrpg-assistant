-- V1__init_schema.sql
-- Pełny schemat aplikacji (CORE)

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- NPC
-- =========================
CREATE TABLE IF NOT EXISTS npc (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  input_json JSONB NOT NULL,
  description_md TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_npc_user_created
ON npc(user_id, created_at DESC);

-- =========================
-- ITEM
-- =========================
CREATE TABLE IF NOT EXISTS item (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  input_json JSONB NOT NULL,
  description_md TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_item_user_created
ON item(user_id, created_at DESC);

-- =========================
-- GENERATION (logi / joby)
-- =========================
CREATE TABLE IF NOT EXISTS generation (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  input_json JSONB NOT NULL,
  openai_output_json JSONB,
  image_prompt_json JSONB,
  deepai_response_json JSONB,
  result_entity_id BIGINT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_user_created
ON generation(user_id, created_at DESC);

-- =========================
-- GLOSSARY (DOCZELOWA WERSJA)
-- =========================
CREATE TABLE IF NOT EXISTS glossary_terms (
  id BIGSERIAL PRIMARY KEY,

  term_pl VARCHAR(120) NOT NULL,
  term_en VARCHAR(120),

  definition TEXT NOT NULL,

  category VARCHAR(60) NOT NULL,
  system VARCHAR(60) NOT NULL DEFAULT 'uniwersalne',

  tags VARCHAR(255) NOT NULL DEFAULT '',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT ux_glossary_term_pl_system UNIQUE (term_pl, system)
);

CREATE INDEX IF NOT EXISTS idx_glossary_system_category
ON glossary_terms(system, category);

-- =========================
-- RULES PAGES
-- =========================
CREATE TABLE IF NOT EXISTS rules_pages (
  id BIGSERIAL PRIMARY KEY,
  system_code VARCHAR(32) NOT NULL,
  slug VARCHAR(64) NOT NULL,
  title VARCHAR(140) NOT NULL,
  content TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_rules_pages_system_slug
ON rules_pages(system_code, slug);

-- =========================
-- CAMPAIGNS
-- =========================
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,
  description_md TEXT NOT NULL DEFAULT '',

  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active/finished

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner_created
ON campaigns(owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role VARCHAR(20) NOT NULL DEFAULT 'player', -- gm/player
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (campaign_id, user_id)
);

-- =========================
-- SESSIONS
-- =========================
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'planned', -- planned/in_progress/finished
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_campaign_created
ON sessions(campaign_id, created_at DESC);

-- =========================
-- CHARACTERS
-- =========================
CREATE TABLE IF NOT EXISTS characters (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(160) NOT NULL,
  system VARCHAR(60) NOT NULL DEFAULT 'dnd5e',

  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_characters_owner_created
ON characters(owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campaign_characters (
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (campaign_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_characters_campaign
ON campaign_characters(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_characters_character
ON campaign_characters(character_id);

-- =========================
-- INITIATIVE
-- =========================
CREATE TABLE IF NOT EXISTS initiative_queues (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,

  title VARCHAR(200) NOT NULL DEFAULT 'Inicjatywa',
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active/archived

  round_number INT NOT NULL DEFAULT 1,
  active_index INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_init_owner_created
ON initiative_queues(owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_init_campaign_updated
ON initiative_queues(campaign_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS initiative_entries (
  id BIGSERIAL PRIMARY KEY,
  queue_id BIGINT NOT NULL REFERENCES initiative_queues(id) ON DELETE CASCADE,

  -- pc -> characters.id
  -- npc -> npc.id
  -- custom -> entity_id NULL
  entity_type VARCHAR(20) NOT NULL DEFAULT 'custom',
  entity_id BIGINT,

  name VARCHAR(200) NOT NULL,
  initiative INT NOT NULL DEFAULT 0,

  ac INT,
  hp_max INT,
  hp_current INT,

  state VARCHAR(20) NOT NULL DEFAULT 'active', -- active/unconscious/dead
  state_note VARCHAR(140) NOT NULL DEFAULT '',

  note TEXT NOT NULL DEFAULT '',

  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_init_entries_queue_sort
ON initiative_entries(queue_id, sort_order, initiative DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_init_entries_queue_entity_type
ON initiative_entries(queue_id, entity_type);
