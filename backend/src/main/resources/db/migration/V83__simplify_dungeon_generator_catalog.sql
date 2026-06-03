UPDATE generator_definitions
SET name = 'Loch',
    description = 'Wiekszy loch z regulowana liczba pomieszczen i poziomow.'
WHERE code = 'dungeon_advanced';

UPDATE generator_variants gv
SET name = 'Loch',
    description = 'Generator lochu z mapa, poziomami i lista pomieszczen.'
FROM generator_definitions gd
WHERE gv.generator_definition_id = gd.id
  AND gd.code = 'dungeon_advanced';

UPDATE generator_definitions
SET is_active = false
WHERE code = 'five_room_dungeon';

UPDATE generator_variants gv
SET is_active = false
FROM generator_definitions gd
WHERE gv.generator_definition_id = gd.id
  AND gd.code = 'five_room_dungeon';
