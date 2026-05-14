-- Second MVP cleanup: separate dungeon, setting-aware story/clue/org forms and shorter labels.

UPDATE generator_definitions
SET is_active = true,
    name = 'Loch',
    description = 'Oddzielny generator lochu z pokojami, przejsciami i miejscem pod prosta mape.',
    category_code = 'UNIVERSAL',
    type_code = 'location',
    display_order = 90,
    updated_at = now()
WHERE code = 'five_room_dungeon';

UPDATE generator_variants gv
SET is_active = true,
    name = 'Loch',
    description = 'Szybki loch z piecioma strefami i prosta mapa.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'five_room_dungeon'
  AND gv.variant_code = 'fantasy.quick';

UPDATE generator_definitions
SET name = 'Przygoda',
    description = 'Krotki zalazek przygody z problemem, detalem, komplikacja i wskazowka.',
    category_code = 'UNIVERSAL',
    type_code = 'story',
    updated_at = now()
WHERE code = 'hook';

UPDATE generator_definitions
SET name = 'Wskazowka',
    description = 'Dowod albo slad do sceny: opis, znaczenie i zwodniczy detal.',
    category_code = 'UNIVERSAL',
    type_code = 'clue',
    updated_at = now()
WHERE code = 'clue';

UPDATE generator_definitions
SET name = 'Lup',
    description = 'Szybki lup: monety, glowny przedmiot, dziwny detal i sekret.',
    category_code = 'UNIVERSAL',
    type_code = 'item',
    updated_at = now()
WHERE code = 'loot_fantasy';

UPDATE generator_definitions
SET description = 'Organizacje dopasowane do settingu: cel, metody, zasoby, sekret i konflikt.',
    updated_at = now()
WHERE code = 'faction';

DELETE FROM generator_field_definitions
WHERE field_key IN ('system', 'tone')
  AND variant_id IN (
    SELECT gv.id
    FROM generator_variants gv
    JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
    WHERE gd.code IN ('clue', 'loot_fantasy', 'five_room_dungeon', 'faction', 'hook')
  );

WITH faction_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'faction' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'setting', 'Setting', 'SELECT',
       '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
       'Losowy', false, 10 FROM faction_variant
UNION ALL
SELECT id, 'factionType', 'Typ organizacji', 'SELECT',
       '["Losowy","Gildia","Zakon","Rada miejska","Kult","Kompania najemna","Cech","Towarzystwo okultystyczne","Fundacja","Krag badaczy","Rodzina wplywow","Korporacja","Zaloga","Agencja","Kartel","Konsorcjum","Ruch oporu","Osada","Banda","Karawana","Milicja","Klan","Syndykat zasobow","Stowarzyszenie","Firma","Komitet","Ruch spoleczny","Siec kontaktow"]'::jsonb,
       'Losowy', false, 20 FROM faction_variant
UNION ALL
SELECT id, 'scale', 'Skala', 'SELECT',
       '["Lokalna","Regionalna","Ukryta","Wplywowa"]'::jsonb,
       'Lokalna', false, 30 FROM faction_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH hook_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'hook' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'setting', 'Setting', 'SELECT',
       '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
       'Losowy', false, 10 FROM hook_variant
UNION ALL
SELECT id, 'mood', 'Rodzaj', 'SELECT',
       '["Losowy","Przygodowy","Tajemnica","Akcja","Groza","Intryga","Eksploracja"]'::jsonb,
       'Losowy', false, 20 FROM hook_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH clue_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'clue' AND gv.variant_code = 'horror.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'setting', 'Setting', 'SELECT',
       '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
       'Losowy', false, 10 FROM clue_variant
UNION ALL
SELECT id, 'clueType', 'Typ wskazowki', 'SELECT',
       '["Losowy","Slad fizyczny","Dokument","Relacja swiadka","Nagranie","Symbol","Log systemowy","Uszkodzony sensor","Mapa","Radio","Monitoring"]'::jsonb,
       'Losowy', false, 20 FROM clue_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH loot_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'loot_fantasy' AND gv.variant_code = 'fantasy.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'lootType', 'Typ lupu', 'SELECT',
       '["Losowy","Monety","Przedmiot","Dokument","Relikwia","Ekwipunek","Osobliwosc"]'::jsonb,
       'Losowy', false, 10 FROM loot_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH dungeon_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'five_room_dungeon' AND gv.variant_code = 'fantasy.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'theme', 'Motyw lochu', 'SELECT',
       '["Losowy","Krypta","Kopalnia","Swiatynia","Wieza maga","Kryjowka bandytow","Ruiny krasnoludzkie"]'::jsonb,
       'Losowy', false, 10 FROM dungeon_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

UPDATE generator_pools
SET payload_json = jsonb_set(
  payload_json::jsonb,
  '{cultures,Łacińska / Rzymska}',
  '{"male":["Marcus","Lucius","Gaius","Titus"],"female":["Julia","Livia","Claudia","Aelia"],"neutral":["Aquila","Felix","Maris"],"family":["Aurelius","Valerius","Cassius","Marcellus"]}'::jsonb,
  true
)
WHERE generator_type = 'name'
  AND system_code = 'any'
  AND subtype = 'default';
