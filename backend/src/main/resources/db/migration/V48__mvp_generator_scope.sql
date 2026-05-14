-- MVP generator scope: keep the catalog small and fast for live-session use.
-- Data stays in place; non-MVP generators are hidden from the active catalog.

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
  'location',
  'faction',
  'weather',
  'hook',
  'npc_fantasy',
  'tavern',
  'dungeon_concept',
  'dungeon_room',
  'loot_fantasy',
  'clue',
  'npc_horror',
  'starship',
  'npc_scifi',
  'shelter',
  'survivor'
);

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code IN ('name','location','faction','weather','hook')
  AND gv.variant_code = 'general.quick';

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code IN ('npc_fantasy','tavern','dungeon_concept','dungeon_room','loot_fantasy')
  AND gv.variant_code = 'fantasy.quick';

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code IN ('clue','npc_horror')
  AND gv.variant_code = 'horror.quick';

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code IN ('starship','npc_scifi')
  AND gv.variant_code = 'scifi.quick';

UPDATE generator_variants gv
SET is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code IN ('shelter','survivor')
  AND gv.variant_code = 'postapo.quick';

UPDATE generator_definitions
SET name = 'Haczyk przygody',
    description = 'Szybki problem, dziwny szczegol, komplikacja i trop.',
    display_order = 50,
    updated_at = now()
WHERE code = 'hook';

UPDATE generator_definitions
SET name = 'Loot lochu',
    description = 'Monety, glowny przedmiot, dziwny detal i haczyk.',
    display_order = 155,
    updated_at = now()
WHERE code = 'loot_fantasy';

UPDATE generator_definitions
SET name = 'Tropy horror',
    description = 'Krotki trop, implikacja i niepokojacy detal.',
    display_order = 310,
    updated_at = now()
WHERE code = 'clue';

UPDATE generator_definitions
SET name = 'NPC realistyczny',
    description = 'Zawod, zachowanie, sekret i wejscie do sceny.',
    display_order = 320,
    updated_at = now()
WHERE code = 'npc_horror';

UPDATE generator_definitions
SET name = 'Statek sci-fi',
    description = 'Typ statku, problem, zaloga lub AI i haczyk.',
    display_order = 410,
    updated_at = now()
WHERE code = 'starship';

UPDATE generator_definitions
SET name = 'Osada postapo',
    description = 'Zasob, problem, lokalna zasada i haczyk.',
    display_order = 510,
    updated_at = now()
WHERE code = 'shelter';

UPDATE generator_definitions
SET name = 'NPC postapo',
    description = 'Ksywa, wyglad, problem, motywacja i dialog.',
    display_order = 520,
    updated_at = now()
WHERE code = 'survivor';
