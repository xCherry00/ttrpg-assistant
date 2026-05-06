UPDATE generator_definitions
SET is_active = false,
    updated_at = now()
WHERE code NOT IN (
  'npc',
  'encounter',
  'location',
  'loot',
  'hook',
  'weather',
  'trap',
  'faction',
  'name'
);

UPDATE generator_definitions
SET name = CASE code
    WHEN 'npc' THEN 'NPC'
    WHEN 'encounter' THEN 'Encounter'
    WHEN 'location' THEN 'Lokacja'
    WHEN 'loot' THEN 'Skarb / Przedmiot'
    WHEN 'hook' THEN 'Fabuła'
    WHEN 'weather' THEN 'Środowisko'
    WHEN 'trap' THEN 'Pułapka / Hazard'
    WHEN 'faction' THEN 'Frakcja / Kult'
    WHEN 'name' THEN 'Imiona / Nazwy'
    ELSE name
  END,
  description = CASE code
    WHEN 'npc' THEN 'Generuje postacie niezależne do scen, kampanii i spotkań.'
    WHEN 'encounter' THEN 'Generuje spotkania bojowe i fabularne do sesji.'
    WHEN 'location' THEN 'Generuje lokacje, miejsca, budynki i punkty zainteresowania.'
    WHEN 'loot' THEN 'Generuje skarby, przedmioty, kosztowności i wyposażenie.'
    WHEN 'hook' THEN 'Generuje hooki, misje i zalążki fabuły.'
    WHEN 'weather' THEN 'Generuje pogodę, warunki i zdarzenia środowiskowe.'
    WHEN 'trap' THEN 'Generuje pułapki, hazardy i zagrożenia.'
    WHEN 'faction' THEN 'Generuje frakcje, kulty, gildie i organizacje.'
    WHEN 'name' THEN 'Generuje imiona, nazwiska i nazwy własne.'
    ELSE description
  END,
  is_active = true,
  updated_at = now()
WHERE code IN (
  'npc',
  'encounter',
  'location',
  'loot',
  'hook',
  'weather',
  'trap',
  'faction',
  'name'
);

UPDATE generator_variants gv
SET name = 'Encounter D&D szybki',
    description = 'Spotkanie bojowe albo non-combat z budżetem XP, celem, twistem i elementem środowiska.',
    is_active = true
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'encounter'
  AND gv.variant_code = 'dnd.quick';

UPDATE generator_field_definitions gfd
SET label = CASE gfd.field_key
    WHEN 'partyLevel' THEN 'Poziom drużyny'
    WHEN 'partySize' THEN 'Liczba postaci'
    WHEN 'difficulty' THEN 'Trudność'
    WHEN 'encounterMode' THEN 'Tryb encountera'
    WHEN 'environment' THEN 'Środowisko'
    WHEN 'encounterType' THEN 'Typ encountera'
    WHEN 'includeTwist' THEN 'Dodaj twist'
    WHEN 'includeEnvironmentFeature' THEN 'Dodaj element środowiska'
    ELSE gfd.label
  END,
  options_json = CASE gfd.field_key
    WHEN 'environment' THEN '["Lochy","Las","Miasto","Ruiny","Góry","Bagna","Podziemia"]'::jsonb
    WHEN 'encounterType' THEN '["Zasadzka","Patrol","Obrona miejsca","Rytuał","Pościg","Negocjacje","Śledztwo","Przeszkoda"]'::jsonb
    ELSE gfd.options_json
  END
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'encounter'
  AND gv.variant_code = 'dnd.quick';
