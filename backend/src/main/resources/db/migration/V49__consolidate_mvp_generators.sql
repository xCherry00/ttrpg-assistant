-- Consolidate MVP generators into fewer, broader tools.
-- NPC and Location become setting-aware instead of separate genre cards.

UPDATE generator_definitions
SET is_active = false,
    updated_at = now();

UPDATE generator_variants
SET is_active = false;

UPDATE generator_definitions
SET is_active = true,
    updated_at = now()
WHERE code IN (
  'name',
  'npc',
  'location',
  'faction',
  'weather',
  'hook',
  'loot_fantasy',
  'clue'
);

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code IN ('name','npc','location','faction','weather','hook')
  AND gv.variant_code = 'general.quick';

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'loot_fantasy'
  AND gv.variant_code = 'fantasy.quick';

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'clue'
  AND gv.variant_code = 'horror.quick';

UPDATE generator_definitions
SET name = 'NPC',
    description = 'Jeden generator postaci z wyborem settingu i roli.',
    category_code = 'UNIVERSAL',
    type_code = 'npc',
    display_order = 20,
    updated_at = now()
WHERE code = 'npc';

UPDATE generator_definitions
SET name = 'Lokacja',
    description = 'Jeden generator miejsc z wyborem settingu i typu lokacji.',
    category_code = 'UNIVERSAL',
    type_code = 'location',
    display_order = 30,
    updated_at = now()
WHERE code = 'location';

UPDATE generator_definitions
SET display_order = 10,
    updated_at = now()
WHERE code = 'name';

UPDATE generator_definitions
SET display_order = 40,
    updated_at = now()
WHERE code = 'faction';

UPDATE generator_definitions
SET display_order = 50,
    updated_at = now()
WHERE code = 'weather';

UPDATE generator_definitions
SET display_order = 60,
    updated_at = now()
WHERE code = 'hook';

WITH npc_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'npc' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'setting', 'Setting', 'SELECT',
       '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
       'Losowy', false, 10 FROM npc_variant
UNION ALL
SELECT id, 'role', 'Rola / funkcja', 'SELECT',
       '["Losowa","Kupiec","Straznik","Uczony","Kaplan","Przestepca","Szlachcic","Rzemieslnik","Podroznik","Sledczy","Swiadek","Podejrzany","Mechanik","Pilot","Medyk","Najemnik","Ocalaly","Lider osady","Szabrownik"]'::jsonb,
       'Losowa', false, 20 FROM npc_variant
UNION ALL
SELECT id, 'includeSecret', 'Dodaj sekret', 'CHECKBOX', '[]'::jsonb, 'true', false, 30 FROM npc_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

DELETE FROM generator_field_definitions
WHERE field_key = 'style'
  AND variant_id IN (
    SELECT gv.id
    FROM generator_variants gv
    JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
    WHERE gd.code = 'npc' AND gv.variant_code = 'general.quick'
  );

WITH location_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'location' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'setting', 'Setting', 'SELECT',
       '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
       'Losowy', false, 10 FROM location_variant
UNION ALL
SELECT id, 'locationType', 'Typ miejsca', 'SELECT',
       '["Losowy","Tawerna","Sklep","Osada","Dzielnica","Swiatynia","Biblioteka","Port","Las","Ruiny","Zamek","Miejsce sledztwa","Archiwum","Szpital","Bunkier","Schronienie","Ruiny miejskie","Farma","Fabryka","Statek kosmiczny","Stacja kosmiczna","Kolonia","Planeta","Laboratorium"]'::jsonb,
       'Losowy', false, 20 FROM location_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;
