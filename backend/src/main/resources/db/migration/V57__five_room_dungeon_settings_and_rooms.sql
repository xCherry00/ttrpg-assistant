-- Make the dungeon generator setting-aware and closer to Donjon-style random rooms.

UPDATE generator_definitions
SET description = 'Generuje pięć tematycznych, losowych komnat z prostą mapą lochu.',
    updated_at = now()
WHERE code = 'five_room_dungeon';

UPDATE generator_variants gv
SET description = 'Pięć losowych komnat w wybranym settingu, prosty plan, cel wyprawy i zagrożenie.'
FROM generator_definitions gd
WHERE gv.generator_definition_id = gd.id
  AND gd.code = 'five_room_dungeon'
  AND gv.variant_code = 'fantasy.quick';

WITH dungeon_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'five_room_dungeon' AND gv.variant_code = 'fantasy.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'setting', 'Setting', 'SELECT',
       '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb,
       'Fantasy', false, 5 FROM dungeon_variant
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
SELECT id, 'theme', 'Motyw miejsca', 'SELECT',
       '["Losowy","Krypta","Kopalnia","Świątynia","Wieża maga","Kryjówka bandytów","Ruiny krasnoludzkie","Katakumby","Podziemny akwedukt","Zapomniane więzienie","Grobowiec rodu","Sanktuarium kultu","Jaskinia potworów","Zatopione ruiny","Magiczne laboratorium","Stara kanalizacja","Opuszczony szpital","Piwnice sanatorium","Dom za lasem","Kanalizacja pod miastem","Kostnica","Bunkier z lat wojny","Hotel bez gości","Stacja metra","Wrak statku","Stacja orbitalna","Laboratorium korporacji","Kopalnia asteroid","Baza na księżycu","Moduł terraformujący","Opuszczony frachtowiec","Archiwum AI","Schron","Metro po katastrofie","Zatopiony supermarket","Fabryka filtrów","Stara baza wojskowa","Osada pod tamą","Magazyn leków","Tunel ewakuacyjny","Zamknięty magazyn","Podziemia kamienicy","Stary fort","Nieczynny hotel","Piwnica komisariatu","Tunel przemytników","Archiwum miejskie","Kanały techniczne"]'::jsonb,
       'Losowy', false, 10 FROM dungeon_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;
