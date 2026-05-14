-- Add a separate advanced dungeon generator for larger maps and multiple floors.

INSERT INTO generator_definitions (
    code, name, description, category, icon, category_code, type_code,
    genre_tags, system_tags, tone_tags, display_order, icon_key, is_active, created_at, updated_at
)
VALUES (
    'dungeon_advanced',
    'Loch zaawansowany',
    'Większy generator lochu: więcej pomieszczeń, większa mapa i opcjonalnie kilka poziomów.',
    'Fantasy',
    'map',
    'FANTASY',
    'location',
    '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
    '["system_agnostic"]'::jsonb,
    '["opisowy"]'::jsonb,
    92,
    'map',
    true,
    now(),
    now()
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    category_code = EXCLUDED.category_code,
    type_code = EXCLUDED.type_code,
    genre_tags = EXCLUDED.genre_tags,
    system_tags = EXCLUDED.system_tags,
    tone_tags = EXCLUDED.tone_tags,
    display_order = EXCLUDED.display_order,
    icon_key = EXCLUDED.icon_key,
    is_active = true,
    updated_at = now();

WITH def AS (
  SELECT id FROM generator_definitions WHERE code = 'dungeon_advanced'
)
INSERT INTO generator_variants (
    generator_definition_id, variant_code, system_code, setting_code,
    name, description, is_active
)
SELECT id, 'fantasy.quick', 'system_agnostic', 'multi',
       'Loch zaawansowany',
       'Większy loch z regulowaną liczbą pomieszczeń i poziomów.',
       true
FROM def
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'dungeon_advanced' AND gv.variant_code = 'fantasy.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'setting', 'Setting', 'SELECT',
       '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
       'Fantasy', false, 5 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'dungeon_advanced' AND gv.variant_code = 'fantasy.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'theme', 'Motyw miejsca', 'SELECT',
       '["Losowy","Krypta","Kopalnia","Świątynia","Wieża maga","Kryjówka bandytów","Ruiny krasnoludzkie","Katakumby","Opuszczony szpital","Wrak statku","Stacja orbitalna","Schron","Metro po katastrofie","Stary fort","Tunel przemytników"]'::jsonb,
       'Losowy', false, 10 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'dungeon_advanced' AND gv.variant_code = 'fantasy.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'roomCount', 'Liczba pomieszczeń', 'NUMBER',
       '[]'::jsonb, '10', false, 20 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'dungeon_advanced' AND gv.variant_code = 'fantasy.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'floors', 'Poziomy', 'NUMBER',
       '[]'::jsonb, '1', false, 30 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;
