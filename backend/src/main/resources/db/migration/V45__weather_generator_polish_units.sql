WITH weather_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'weather' AND gv.variant_code = 'general.quick'
)
UPDATE generator_field_definitions
SET label = 'Klimat',
    options_json = '["Umiarkowany","Tropikalny","Suchy","Zimny","Górski"]'::jsonb,
    default_value = 'Umiarkowany',
    required = true,
    order_index = 10
WHERE field_key = 'climate'
  AND variant_id IN (SELECT id FROM weather_variant);

WITH weather_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'weather' AND gv.variant_code = 'general.quick'
)
UPDATE generator_field_definitions
SET label = 'Pora roku',
    options_json = '["Wiosna","Lato","Jesień","Zima"]'::jsonb,
    default_value = 'Wiosna',
    required = true,
    order_index = 20
WHERE field_key = 'season'
  AND variant_id IN (SELECT id FROM weather_variant);

UPDATE generator_definitions
SET name = 'Pogoda',
    description = 'Generuje opis pogody, temperaturę w stopniach Celsjusza oraz wiatr w km/h.',
    updated_at = now()
WHERE code = 'weather';

UPDATE generator_variants
SET name = 'Pogoda',
    description = 'Pogoda oparta o klimat i porę roku: opis, temperatura oraz wiatr.'
WHERE generator_definition_id = (SELECT id FROM generator_definitions WHERE code = 'weather')
  AND variant_code = 'general.quick';
