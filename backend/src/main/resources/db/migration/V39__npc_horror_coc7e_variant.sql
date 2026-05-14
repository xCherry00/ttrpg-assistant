WITH horror_def AS (
  SELECT id FROM generator_definitions WHERE code = 'npc_horror'
)
INSERT INTO generator_variants (
  generator_definition_id, variant_code, system_code, setting_code,
  category_code, tone_scope, mode, name, description, is_active
)
SELECT
  id,
  'coc7e.quick',
  'coc7e',
  'horror',
  'HORROR',
  '["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","investigation_horror","survival_horror"]'::jsonb,
  'quick',
  'NPC CoC 7E szybki',
  'Generuje postac do Zew Cthulhu z pelnym blokiem statystyk, zawodem, umiejetnosciami i tlem fabularnym.',
  true
FROM horror_def
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    category_code = EXCLUDED.category_code,
    tone_scope = EXCLUDED.tone_scope,
    mode = EXCLUDED.mode,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'npc_horror' AND gv.variant_code = 'coc7e.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT v.id, field_key, label, type, options_json::jsonb, default_value, required, order_index
FROM variant v
CROSS JOIN (VALUES
  ('tone',  'Klimat',   'SELECT', '["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","investigation_horror","survival_horror"]', 'investigation_horror', true,  10),
  ('role',  'Zawod NPC','SELECT', '["Losowy","Sledczy","Uczony","Elita","Mistyk","Twardziel"]',                                                                    'Losowy',               false, 20)
) AS fields(field_key, label, type, options_json, default_value, required, order_index)
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label         = EXCLUDED.label,
    type          = EXCLUDED.type,
    options_json  = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required      = EXCLUDED.required,
    order_index   = EXCLUDED.order_index;
