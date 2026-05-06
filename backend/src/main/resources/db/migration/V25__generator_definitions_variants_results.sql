CREATE TABLE IF NOT EXISTS generator_definitions (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500),
  category VARCHAR(40) NOT NULL,
  icon VARCHAR(48),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generator_variants (
  id BIGSERIAL PRIMARY KEY,
  generator_definition_id BIGINT NOT NULL REFERENCES generator_definitions(id) ON DELETE CASCADE,
  variant_code VARCHAR(80) NOT NULL,
  system_code VARCHAR(32) NOT NULL DEFAULT 'any',
  setting_code VARCHAR(48) NOT NULL DEFAULT 'none',
  mode VARCHAR(32) NOT NULL DEFAULT 'quick',
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT ux_generator_variant_code UNIQUE (generator_definition_id, variant_code)
);

CREATE TABLE IF NOT EXISTS generator_field_definitions (
  id BIGSERIAL PRIMARY KEY,
  variant_id BIGINT NOT NULL REFERENCES generator_variants(id) ON DELETE CASCADE,
  field_key VARCHAR(80) NOT NULL,
  label VARCHAR(120) NOT NULL,
  type VARCHAR(32) NOT NULL,
  options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_value VARCHAR(200),
  required BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL DEFAULT 0,
  CONSTRAINT ux_generator_field_key UNIQUE (variant_id, field_key)
);

CREATE TABLE IF NOT EXISTS generator_results (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  campaign_id BIGINT,
  generator_code VARCHAR(64) NOT NULL,
  variant_code VARCHAR(80) NOT NULL,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  title VARCHAR(160) NOT NULL,
  summary VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_generator_results_created_at
  ON generator_results(created_at DESC);

CREATE TABLE IF NOT EXISTS generator_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  name VARCHAR(120) NOT NULL,
  generator_code VARCHAR(64) NOT NULL,
  variant_code VARCHAR(80) NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO generator_definitions (code, name, description, category, icon, is_active)
VALUES
  ('npc', 'NPC', 'Generuje postacie niezależne do scen, kampanii i spotkań.', 'CORE', 'user', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (
  generator_definition_id,
  variant_code,
  system_code,
  setting_code,
  mode,
  name,
  description,
  is_active
)
SELECT
  gd.id,
  'general.quick',
  'any',
  'none',
  'quick',
  'NPC ogólny szybki',
  'Szybki NPC bez mechaniki systemowej: imię, rola, wygląd, osobowość, motywacja i opcjonalny sekret.',
  true
FROM generator_definitions gd
WHERE gd.code = 'npc'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    mode = EXCLUDED.mode,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'npc' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'role', 'Rola NPC', 'SELECT', '["Losowa","Kupiec","Strażnik","Uczony","Kapłan","Przestępca","Szlachcic","Rzemieślnik","Podróżnik"]'::jsonb, 'Losowa', false, 10 FROM variant
UNION ALL
SELECT id, 'style', 'Styl', 'SELECT', '["Fantasy","Realistyczny","Mroczny","Dworski","Uliczny"]'::jsonb, 'Fantasy', false, 20 FROM variant
UNION ALL
SELECT id, 'includeSecret', 'Dodaj sekret', 'CHECKBOX', '[]'::jsonb, 'true', false, 30 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

INSERT INTO generator_pools (generator_type, system_code, subtype, payload_json)
VALUES
  ('npc', 'any', 'general.quick', $json$
  {
    "givenNames": ["Alaric","Mira","Toren","Selene","Bran","Kaela","Darian","Ira","Lech","Nadia","Corvin","Lada"],
    "familyNames": ["Czarnybrzeg","Ashthorne","Ruczaj","Blackwater","Kamieniec","Stormglass","Sokolik","Ravenmark"],
    "roles": ["Kupiec","Strażnik","Uczony","Kapłan","Przestępca","Szlachcic","Rzemieślnik","Podróżnik"],
    "appearances": [
      "ma zmęczone oczy i płaszcz z ukrytymi kieszeniami",
      "nosi prosty strój, ale porusza się z pewnością kogoś ważnego",
      "ma świeżą bliznę na dłoni i unika patrzenia w oczy",
      "pachnie dymem, atramentem i tanim winem",
      "mówi cicho, a każdy gest wygląda na dokładnie przemyślany"
    ],
    "personalities": [
      "uprzejmy, ale bardzo ostrożny",
      "nerwowy i skłonny do szybkich obietnic",
      "bezpośredni, praktyczny i mało cierpliwy",
      "ciepły w rozmowie, lecz wyraźnie coś ukrywa",
      "dumny, ambitny i wrażliwy na brak szacunku"
    ],
    "motivations": [
      "chce spłacić dawny dług zanim wierzyciel straci cierpliwość",
      "szuka osoby, która zniknęła po ostatniej pełni",
      "próbuje odzyskać dobre imię swojej rodziny",
      "zbiera informacje dla wpływowego patrona",
      "chce uciec z miasta, ale potrzebuje ostatniej przysługi"
    ],
    "secrets": [
      "pracuje dla wrogiej frakcji",
      "ukrywa prawdziwe nazwisko",
      "był świadkiem zbrodni, o której wszyscy milczą",
      "ma przy sobie przedmiot należący do zaginionej osoby",
      "sprzedał komuś informację, która może zaszkodzić drużynie"
    ],
    "hooks": [
      "prosi drużynę o dyskretną rozmowę po zmroku",
      "rozpoznaje jeden z przedmiotów drużyny i reaguje zbyt nerwowo",
      "zna skrót do ważnego miejsca, ale oczekuje przysługi",
      "ktoś śledzi NPC i może wciągnąć drużynę w kłopoty"
    ]
  }
  $json$::jsonb)
ON CONFLICT (generator_type, system_code, subtype) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
