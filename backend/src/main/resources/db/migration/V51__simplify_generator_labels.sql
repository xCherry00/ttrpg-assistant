-- Simplify MVP labels: no slash-style names in generator UI.

UPDATE generator_definitions
SET name = 'Organizacje',
    description = 'Organizacje, gildie, kulty, gangi, zakony i tajne stowarzyszenia.',
    updated_at = now()
WHERE code = 'faction';

UPDATE generator_definitions
SET name = 'Imiona',
    updated_at = now()
WHERE code = 'name';

UPDATE generator_definitions
SET name = 'Skarb',
    description = 'Monety, glowny przedmiot, dziwny detal i haczyk.',
    updated_at = now()
WHERE code = 'loot_fantasy';

UPDATE generator_field_definitions
SET label = 'Rola'
WHERE field_key = 'role'
  AND variant_id IN (
    SELECT gv.id
    FROM generator_variants gv
    JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
    WHERE gd.code = 'npc'
  );
