UPDATE generator_field_definitions gfd
SET label = 'Liczba pomieszczen (5-11)',
    default_value = '10'
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'dungeon_advanced'
  AND gfd.field_key = 'roomCount';

UPDATE generator_field_definitions gfd
SET label = 'Poziomy (1-5)',
    default_value = '1'
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'dungeon_advanced'
  AND gfd.field_key = 'floors';
