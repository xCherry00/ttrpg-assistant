WITH weather_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'weather' AND gv.variant_code = 'general.quick'
)
DELETE FROM generator_field_definitions
WHERE variant_id IN (SELECT id FROM weather_variant);

WITH weather_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'weather' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'climate', 'Climate', 'SELECT', '["Temperate","Tropical","Arid","Cold","Mountain"]'::jsonb, 'Temperate', true, 10 FROM weather_variant
UNION ALL
SELECT id, 'season', 'Season', 'SELECT', '["Spring","Summer","Autumn","Winter"]'::jsonb, 'Spring', true, 20 FROM weather_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

UPDATE generator_definitions
SET description = 'Generuje opis pogody, temperaturę high/low, odchylenie od normy oraz wiatr.',
    updated_at = now()
WHERE code = 'weather';

UPDATE generator_variants
SET description = 'Pogoda oparta wyłącznie o klimat i porę roku: opis, temperatura oraz wiatr.'
WHERE generator_definition_id = (SELECT id FROM generator_definitions WHERE code = 'weather')
  AND variant_code = 'general.quick';
