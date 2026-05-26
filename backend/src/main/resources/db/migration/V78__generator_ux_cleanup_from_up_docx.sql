UPDATE generator_definitions
SET name = CASE code
    WHEN 'event_quick' THEN 'Losowe wydarzenie'
    WHEN 'food_quick' THEN 'Posilek / Menu'
    WHEN 'shop_quick' THEN 'Sklep / Handel'
    WHEN 'story_hook_quick' THEN 'Plotka / Zlecenie'
    WHEN 'encounter_quick' THEN 'Spotkanie'
    WHEN 'complication_quick' THEN 'Komplikacja sceny'
    WHEN 'document_quick' THEN 'Dokument / Znalezisko'
    ELSE name
  END,
  description = CASE code
    WHEN 'event_quick' THEN 'Wydarzenie zalezne od miejsca i nastroju.'
    WHEN 'food_quick' THEN 'Generator jedzenia i napojow.'
    WHEN 'shop_quick' THEN 'Generator sklepow i handlu.'
    WHEN 'story_hook_quick' THEN 'Pogloski, zlecenia i haki fabularne.'
    WHEN 'encounter_quick' THEN 'Spotkanie do wrzucenia w podrozy, miescie, lochu albo dziczy.'
    WHEN 'complication_quick' THEN 'Twist lub utrudnienie do aktualnej sceny.'
    WHEN 'document_quick' THEN 'Listy, dzienniki, akty, raporty, mapy i inne dokumenty.'
    ELSE description
  END,
  updated_at = now()
WHERE code IN ('event_quick', 'food_quick', 'shop_quick', 'story_hook_quick', 'encounter_quick', 'complication_quick', 'document_quick');

UPDATE generator_variants gv
SET name = CASE gd.code
    WHEN 'event_quick' THEN 'Wydarzenie'
    WHEN 'food_quick' THEN 'Jedzenie'
    WHEN 'shop_quick' THEN 'Sklep'
    WHEN 'story_hook_quick' THEN 'Fabula'
    WHEN 'encounter_quick' THEN 'Spotkanie'
    WHEN 'complication_quick' THEN 'Komplikacja'
    WHEN 'document_quick' THEN 'Dokument'
    ELSE gv.name
  END,
  description = CASE gd.code
    WHEN 'event_quick' THEN 'Wydarzenie, jego rodzaj i skutek.'
    WHEN 'food_quick' THEN 'Nazwa i opis jedzenia lub napoju.'
    WHEN 'shop_quick' THEN 'Nazwa, wlasciciel, oferta dnia i problem sklepu.'
    WHEN 'story_hook_quick' THEN 'Pogloski i haki fabularne zalezne od typu.'
    WHEN 'encounter_quick' THEN 'Spotkanie z miejscem, zagrozeniem, tonem i komplikacja.'
    WHEN 'complication_quick' THEN 'Twist sceny z natychmiastowym efektem i przyczyna.'
    WHEN 'document_quick' THEN 'Dokument, autor, fragment tresci i ukryte znaczenie.'
    ELSE gv.description
  END
FROM generator_definitions gd
WHERE gv.generator_definition_id = gd.id
  AND gd.code IN ('event_quick', 'food_quick', 'shop_quick', 'story_hook_quick', 'encounter_quick', 'complication_quick', 'document_quick')
  AND gv.variant_code = 'general.quick';

DELETE FROM generator_field_definitions gfd
USING generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND (
    (gd.code = 'npc' AND gfd.field_key = 'includeSecret')
    OR (gd.code = 'shop_quick' AND gfd.field_key = 'includeProblem')
  );

WITH event_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'event_quick'
    AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'eventMood', 'Rodzaj wydarzenia', 'SELECT',
       '["Losowy","Dobre","Neutralne","Zle","Dziwne","Niebezpieczne"]'::jsonb,
       'Losowy', false, 20
FROM event_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

UPDATE generator_field_definitions gfd
SET label = 'Liczba pomieszczen (6-11)',
    default_value = '10'
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'dungeon_advanced'
  AND gfd.field_key = 'roomCount';
