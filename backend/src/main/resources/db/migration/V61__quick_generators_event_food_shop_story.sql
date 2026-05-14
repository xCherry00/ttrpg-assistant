INSERT INTO generator_definitions (
    code, name, description, category, icon, category_code, type_code,
    genre_tags, system_tags, tone_tags, display_order, icon_key, is_active, created_at, updated_at
)
VALUES
    ('event_quick', 'Wydarzenia', 'Szybkie wydarzenie zalezne od miejsca.', 'Narzedzia', 'zap', 'UTILITY', 'scene', '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb, '["system_agnostic"]'::jsonb, '["opisowy"]'::jsonb, 140, 'zap', true, now(), now()),
    ('food_quick', 'Jedzenie / Posilek', 'Szybki generator jedzenia i napojow.', 'Narzedzia', 'utensils', 'UTILITY', 'scene', '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb, '["system_agnostic"]'::jsonb, '["opisowy"]'::jsonb, 141, 'utensils', true, now(), now()),
    ('shop_quick', 'Sklepy / Handel', 'Szybki generator sklepow i handlu.', 'Narzedzia', 'store', 'UTILITY', 'location', '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb, '["system_agnostic"]'::jsonb, '["opisowy"]'::jsonb, 142, 'store', true, now(), now()),
    ('story_hook_quick', 'Fabula / Pogloski', 'Pogloski, zlecenia i inne haki fabularne.', 'Narzedzia', 'scroll', 'UTILITY', 'story', '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb, '["system_agnostic"]'::jsonb, '["opisowy"]'::jsonb, 143, 'scroll', true, now(), now())
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

WITH data(code, variant_name, variant_desc) AS (
    VALUES
        ('event_quick', 'Wydarzenia szybkie', 'Wydarzenie i opcjonalny skutek.'),
        ('food_quick', 'Jedzenie szybkie', 'Nazwa, opis i opcjonalna cena.'),
        ('shop_quick', 'Sklep szybki', 'Nazwa, wlasciciel i oferta dnia.'),
        ('story_hook_quick', 'Fabula szybka', 'Pogloski i haki fabularne zalezne od typu.')
)
INSERT INTO generator_variants (
    generator_definition_id, variant_code, system_code, setting_code,
    name, description, is_active
)
SELECT gd.id, 'general.quick', 'system_agnostic', 'multi', data.variant_name, data.variant_desc, true
FROM data
JOIN generator_definitions gd ON gd.code = data.code
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'general.quick'
    AND gd.code IN ('event_quick', 'food_quick', 'shop_quick', 'story_hook_quick')
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'eventType', 'Typ wydarzenia', 'SELECT',
       '["Losowy","Miasto","Las","Pustynia","Morze","Nocna warta"]'::jsonb, 'Losowy', true, 10
FROM variants
WHERE code = 'event_quick'
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'general.quick'
    AND gd.code IN ('event_quick', 'food_quick', 'shop_quick', 'story_hook_quick')
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'foodType', 'Typ jedzenia', 'SELECT',
       '["Losowy","Sniadanie","Zupa","Danie glowne","Deser","Napoj bezalkoholowy","Napoj alkoholowy"]'::jsonb, 'Losowy', true, 10
FROM variants
WHERE code = 'food_quick'
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'general.quick'
    AND gd.code IN ('event_quick', 'food_quick', 'shop_quick', 'story_hook_quick')
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'shopType', 'Typ sklepu', 'SELECT',
       '["Losowy","Karczma i zajazd","Sklep ogolny","Kowal","Zielarz","Magiczne dobra"]'::jsonb, 'Losowy', true, 10
FROM variants
WHERE code = 'shop_quick'
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'general.quick'
    AND gd.code IN ('event_quick', 'food_quick', 'shop_quick', 'story_hook_quick')
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'storyType', 'Typ fabuly', 'SELECT',
       '["Losowy","Pogloska","Zlecenie","List gonczy","Choroba","Zaginiona osoba","Dziwne zjawisko","Sekret frakcji"]'::jsonb, 'Losowy', true, 10
FROM variants
WHERE code = 'story_hook_quick'
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

