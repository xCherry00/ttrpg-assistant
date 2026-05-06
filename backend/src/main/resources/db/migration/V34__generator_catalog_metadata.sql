ALTER TABLE generator_definitions
  ADD COLUMN IF NOT EXISTS category_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS type_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS genre_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS system_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tone_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_key VARCHAR(80);

ALTER TABLE generator_variants
  ADD COLUMN IF NOT EXISTS category_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tone_scope JSONB DEFAULT '[]'::jsonb;

UPDATE generator_definitions
SET category_code = 'FANTASY',
    genre_tags = '["fantasy"]'::jsonb,
    tone_tags = '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb,
    type_code = CASE code
      WHEN 'npc' THEN 'npc'
      WHEN 'encounter' THEN 'encounter'
      WHEN 'location' THEN 'location'
      WHEN 'loot' THEN 'item'
      WHEN 'hook' THEN 'story'
      WHEN 'weather' THEN 'environment'
      WHEN 'trap' THEN 'threat'
      WHEN 'faction' THEN 'faction'
      WHEN 'name' THEN 'name'
      ELSE COALESCE(type_code, 'story')
    END,
    system_tags = CASE code
      WHEN 'encounter' THEN '["dnd","dnd5e"]'::jsonb
      WHEN 'loot' THEN '["dnd","dnd5e"]'::jsonb
      WHEN 'npc' THEN '["system_agnostic","dnd","dnd5e"]'::jsonb
      ELSE '["system_agnostic","dnd","dnd5e","pf2e","wfrp4e","morkborg"]'::jsonb
    END,
    display_order = CASE code
      WHEN 'npc' THEN 10
      WHEN 'encounter' THEN 20
      WHEN 'location' THEN 30
      WHEN 'loot' THEN 40
      WHEN 'hook' THEN 50
      WHEN 'weather' THEN 60
      WHEN 'trap' THEN 70
      WHEN 'faction' THEN 80
      WHEN 'name' THEN 90
      ELSE 200
    END,
    icon_key = CASE code
      WHEN 'npc' THEN 'hood'
      WHEN 'encounter' THEN 'swords'
      WHEN 'location' THEN 'castle'
      WHEN 'loot' THEN 'chest'
      WHEN 'hook' THEN 'scroll'
      WHEN 'weather' THEN 'storm'
      WHEN 'trap' THEN 'gear'
      WHEN 'faction' THEN 'shield'
      WHEN 'name' THEN 'type'
      ELSE COALESCE(icon_key, icon)
    END,
    updated_at = now()
WHERE code IN ('npc', 'encounter', 'location', 'loot', 'hook', 'weather', 'trap', 'faction', 'name');

UPDATE generator_variants gv
SET category_code = COALESCE(gd.category_code, 'FANTASY'),
    tone_scope = COALESCE(NULLIF(gd.tone_tags, '[]'::jsonb), '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb)
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code IN ('npc', 'encounter', 'location', 'loot', 'hook', 'weather', 'trap', 'faction', 'name');
