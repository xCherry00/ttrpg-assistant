-- Tune the separate dungeon generator toward a compact five-room dungeon flow.

UPDATE generator_definitions
SET name = 'Loch',
    description = 'Generuje pięciopokojowy loch: wejście, wyzwanie, komplikację, konflikt, nagrodę i prostą mapę.',
    category_code = 'FANTASY',
    type_code = 'location',
    display_order = 90,
    icon_key = 'map',
    updated_at = now()
WHERE code = 'five_room_dungeon';

UPDATE generator_variants gv
SET name = 'Loch',
    description = 'Szybki pięciopokojowy loch w stylu donjon: 5 scen, prosty plan i haczyk do sesji.'
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
SELECT id, 'theme', 'Motyw lochu', 'SELECT',
       '["Losowy","Krypta","Kopalnia","Świątynia","Wieża maga","Kryjówka bandytów","Ruiny krasnoludzkie","Katakumby","Podziemny akwedukt","Zapomniane więzienie","Grobowiec rodu","Sanktuarium kultu","Jaskinia potworów","Zatopione ruiny","Magiczne laboratorium","Stara kanalizacja"]'::jsonb,
       'Losowy', false, 10 FROM dungeon_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;
