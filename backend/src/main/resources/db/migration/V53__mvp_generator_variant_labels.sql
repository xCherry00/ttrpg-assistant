-- Keep visible variant labels aligned with the simplified MVP catalog.

UPDATE generator_definitions
SET display_order = 70,
    updated_at = now()
WHERE code = 'loot_fantasy';

UPDATE generator_definitions
SET display_order = 80,
    updated_at = now()
WHERE code = 'clue';

UPDATE generator_variants gv
SET name = 'NPC',
    description = 'Szybki NPC z wyborem settingu, roli, wygladu, osobowosci i sekretu.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'npc'
  AND gv.variant_code = 'general.quick';

UPDATE generator_variants gv
SET name = 'Lokacja',
    description = 'Miejsce dopasowane do settingu i wybranego typu.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'location'
  AND gv.variant_code = 'general.quick';

UPDATE generator_variants gv
SET name = 'Organizacje',
    description = 'Organizacja dopasowana do settingu: cel, metody, zasoby, sekret i konflikt.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'faction'
  AND gv.variant_code = 'general.quick';

UPDATE generator_variants gv
SET name = 'Przygoda',
    description = 'Krotki zalazek przygody z problemem, detalem, komplikacja i wskazowka.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'hook'
  AND gv.variant_code = 'general.quick';

UPDATE generator_variants gv
SET name = 'Lup',
    description = 'Monety, glowny przedmiot, dziwny detal i sekret.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'loot_fantasy'
  AND gv.variant_code = 'fantasy.quick';

UPDATE generator_variants gv
SET name = 'Wskazowka',
    description = 'Dowod albo slad do sceny: opis, znaczenie i zwodniczy detal.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'clue'
  AND gv.variant_code = 'horror.quick';
