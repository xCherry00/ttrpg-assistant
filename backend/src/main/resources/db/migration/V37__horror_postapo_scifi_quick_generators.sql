WITH data(code, name, description, category_code, type_code, display_order, icon_key, system_tags, tone_tags, variant_code, setting_code) AS (
  VALUES
    ('npc_horror', 'NPC horror', 'Generuje postac powiazana z tajemnica, sekretem i zagrozeniem.', 'HORROR', 'npc', 10, 'eye', '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","investigation_horror","survival_horror"]'::jsonb, 'horror.quick', 'horror'),
    ('clue', 'Trop / wskazowka', 'Generuje trop do sledztwa, jego miejsce, interpretacje i falszywy kierunek.', 'HORROR', 'document', 20, 'scroll', '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","psychological_horror","investigation_horror"]'::jsonb, 'horror.quick', 'horror'),
    ('cult_horror', 'Kult horror', 'Generuje kult, wierzenia, rytual, lidera i slabosc.', 'HORROR', 'faction', 30, 'shield', '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","religious_horror","urban_horror"]'::jsonb, 'horror.quick', 'horror'),
    ('horror_creature', 'Istota horror', 'Generuje istote, slady obecnosci, sposob dzialania i przetrwanie.', 'HORROR', 'creature', 40, 'swords', '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","body_horror","folk_horror","survival_horror"]'::jsonb, 'horror.quick', 'horror'),
    ('survivor', 'Ocalaly', 'Generuje ocalalego, traume, umiejetnosc i potrzebe.', 'POSTAPO', 'npc', 10, 'hood', '["system_agnostic"]'::jsonb, '["zombie_apocalypse","survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb, 'postapo.quick', 'postapo'),
    ('shelter', 'Schronienie', 'Generuje schronienie, zabezpieczenia, slaby punkt i sekret.', 'POSTAPO', 'location', 20, 'castle', '["system_agnostic"]'::jsonb, '["zombie_apocalypse","survival_drama","wasteland","ruined_city"]'::jsonb, 'postapo.quick', 'postapo'),
    ('supply_run', 'Wyprawa po zasoby', 'Generuje cel wyprawy, lokacje, zasob i komplikacje.', 'POSTAPO', 'quest', 30, 'chest', '["system_agnostic"]'::jsonb, '["survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb, 'postapo.quick', 'postapo'),
    ('zombie_variant', 'Wariant zombie', 'Generuje wariant zombie, zachowanie i sposob unikania.', 'POSTAPO', 'creature', 40, 'swords', '["system_agnostic"]'::jsonb, '["zombie_apocalypse","survival_horror","plague_apocalypse"]'::jsonb, 'postapo.quick', 'postapo'),
    ('npc_scifi', 'NPC sci-fi', 'Generuje postac sci-fi z funkcja, sekretem i konfliktem.', 'SCIFI', 'npc', 10, 'rocket', '["system_agnostic","alien","mothership","cyberpunk"]'::jsonb, '["space_opera","hard_scifi","cyberpunk","space_horror","dystopia","corporate_scifi"]'::jsonb, 'scifi.quick', 'scifi'),
    ('planet', 'Planeta', 'Generuje planete, srodowisko, kolonie, zasob i tajemnice.', 'SCIFI', 'location', 20, 'planet', '["system_agnostic","alien","mothership","starfinder"]'::jsonb, '["space_opera","hard_scifi","space_horror","dystopia","exploration_scifi"]'::jsonb, 'scifi.quick', 'scifi'),
    ('space_station', 'Stacja kosmiczna', 'Generuje stacje, sekcje, problem i ukryty rozkaz.', 'SCIFI', 'location', 30, 'rocket', '["system_agnostic","alien","mothership"]'::jsonb, '["hard_scifi","space_horror","corporate_scifi","dystopia"]'::jsonb, 'scifi.quick', 'scifi'),
    ('anomaly', 'Anomalia', 'Generuje anomalie, objawy, efekt i sposob badania.', 'SCIFI', 'threat', 40, 'spark', '["system_agnostic","alien","mothership"]'::jsonb, '["hard_scifi","space_horror","dystopia","exploration_scifi"]'::jsonb, 'scifi.quick', 'scifi')
)
INSERT INTO generator_definitions (
  code,
  name,
  description,
  category,
  icon,
  category_code,
  type_code,
  genre_tags,
  system_tags,
  tone_tags,
  display_order,
  icon_key,
  is_active
)
SELECT
  code,
  name,
  description,
  'SETTING',
  icon_key,
  category_code,
  type_code,
  jsonb_build_array(lower(category_code)),
  system_tags,
  tone_tags,
  display_order,
  icon_key,
  true
FROM data
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    category_code = EXCLUDED.category_code,
    type_code = EXCLUDED.type_code,
    genre_tags = EXCLUDED.genre_tags,
    system_tags = EXCLUDED.system_tags,
    tone_tags = EXCLUDED.tone_tags,
    display_order = EXCLUDED.display_order,
    icon_key = EXCLUDED.icon_key,
    is_active = EXCLUDED.is_active,
    updated_at = now();

WITH data(code, variant_code, setting_code, category_code, tone_tags) AS (
  VALUES
    ('npc_horror','horror.quick','horror','HORROR','["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","investigation_horror","survival_horror"]'::jsonb),
    ('clue','horror.quick','horror','HORROR','["cosmic_horror","occult_horror","folk_horror","psychological_horror","investigation_horror"]'::jsonb),
    ('cult_horror','horror.quick','horror','HORROR','["cosmic_horror","occult_horror","folk_horror","religious_horror","urban_horror"]'::jsonb),
    ('horror_creature','horror.quick','horror','HORROR','["cosmic_horror","body_horror","folk_horror","survival_horror"]'::jsonb),
    ('survivor','postapo.quick','postapo','POSTAPO','["zombie_apocalypse","survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb),
    ('shelter','postapo.quick','postapo','POSTAPO','["zombie_apocalypse","survival_drama","wasteland","ruined_city"]'::jsonb),
    ('supply_run','postapo.quick','postapo','POSTAPO','["survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb),
    ('zombie_variant','postapo.quick','postapo','POSTAPO','["zombie_apocalypse","survival_horror","plague_apocalypse"]'::jsonb),
    ('npc_scifi','scifi.quick','scifi','SCIFI','["space_opera","hard_scifi","cyberpunk","space_horror","dystopia","corporate_scifi"]'::jsonb),
    ('planet','scifi.quick','scifi','SCIFI','["space_opera","hard_scifi","space_horror","dystopia","exploration_scifi"]'::jsonb),
    ('space_station','scifi.quick','scifi','SCIFI','["hard_scifi","space_horror","corporate_scifi","dystopia"]'::jsonb),
    ('anomaly','scifi.quick','scifi','SCIFI','["hard_scifi","space_horror","dystopia","exploration_scifi"]'::jsonb)
)
INSERT INTO generator_variants (
  generator_definition_id,
  variant_code,
  system_code,
  setting_code,
  category_code,
  tone_scope,
  mode,
  name,
  description,
  is_active
)
SELECT
  gd.id,
  data.variant_code,
  'system_agnostic',
  data.setting_code,
  data.category_code,
  data.tone_tags,
  'quick',
  gd.name || ' szybki',
  gd.description,
  true
FROM data
JOIN generator_definitions gd ON gd.code = data.code
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    category_code = EXCLUDED.category_code,
    tone_scope = EXCLUDED.tone_scope,
    mode = EXCLUDED.mode,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variants AS (
  SELECT gd.code, gd.category_code, gv.variant_code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code IN (
    'npc_horror','clue','cult_horror','horror_creature',
    'survivor','shelter','supply_run','zombie_variant',
    'npc_scifi','planet','space_station','anomaly'
  )
),
fields AS (
  SELECT id, 'tone' AS field_key, 'Klimat' AS label, 'SELECT' AS type,
         CASE category_code
           WHEN 'HORROR' THEN '["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","investigation_horror","survival_horror"]'::jsonb
           WHEN 'POSTAPO' THEN '["zombie_apocalypse","survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb
           ELSE '["space_opera","hard_scifi","cyberpunk","space_horror","dystopia","corporate_scifi"]'::jsonb
         END AS options_json,
         CASE category_code
           WHEN 'HORROR' THEN 'investigation_horror'
           WHEN 'POSTAPO' THEN 'survival_drama'
           ELSE 'space_horror'
         END AS default_value,
         true AS required,
         10 AS order_index
  FROM variants
  UNION ALL
  SELECT id, 'system', 'System', 'SELECT',
         CASE category_code
           WHEN 'HORROR' THEN '["system_agnostic","coc7e"]'::jsonb
           WHEN 'POSTAPO' THEN '["system_agnostic"]'::jsonb
           ELSE '["system_agnostic","alien","mothership","cyberpunk","starfinder"]'::jsonb
         END,
         'system_agnostic', true, 20
  FROM variants
  UNION ALL
  SELECT id, 'role', 'Rola', 'SELECT',
         '["Losowa","Swiadek","Ofiara","Badacz","Informator","Podejrzany"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code IN ('npc_horror', 'npc_scifi', 'survivor')
  UNION ALL
  SELECT id, 'clueType', 'Typ tropu', 'SELECT',
         '["Losowy","Dokument","Slad fizyczny","Zeznanie","Symbol","Nagranie"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'clue'
  UNION ALL
  SELECT id, 'scope', 'Zasieg', 'SELECT',
         '["Lokalny","Miejski","Regionalny","Ukryta siatka"]'::jsonb,
         'Lokalny', false, 30 FROM variants WHERE code = 'cult_horror'
  UNION ALL
  SELECT id, 'visibilityLevel', 'Widocznosc', 'SELECT',
         '["Czesciowa","Poszlaki","Bezposrednia","Tylko skutki"]'::jsonb,
         'Czesciowa', false, 30 FROM variants WHERE code = 'horror_creature'
  UNION ALL
  SELECT id, 'shelterType', 'Typ schronienia', 'SELECT',
         '["Losowy","Bunkier","Szkola","Stacja","Blok mieszkalny","Magazyn"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'shelter'
  UNION ALL
  SELECT id, 'supplyGoal', 'Cel wyprawy', 'SELECT',
         '["Losowy","Leki","Paliwo","Jedzenie","Czesci","Amunicja"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'supply_run'
  UNION ALL
  SELECT id, 'threatLevel', 'Poziom zagrozenia', 'SELECT',
         '["Niskie","Srednie","Wysokie","Katastrofalne"]'::jsonb,
         'Srednie', false, 30 FROM variants WHERE code = 'zombie_variant'
  UNION ALL
  SELECT id, 'planetType', 'Typ planety', 'SELECT',
         '["Losowy","Pustynna","Oceaniczna","Lodowa","Gornicza","Kolonijna"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'planet'
  UNION ALL
  SELECT id, 'state', 'Stan', 'SELECT',
         '["Losowy","Opuszczona","Awaryjna","Zamknieta","Przeludniona","Cicha"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'space_station'
  UNION ALL
  SELECT id, 'stability', 'Stabilnosc', 'SELECT',
         '["Stabilna","Niestabilna","Rosnaca","Zanikajaca","Cykliczna"]'::jsonb,
         'Niestabilna', false, 30 FROM variants WHERE code = 'anomaly'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, field_key, label, type, options_json, default_value, required, order_index
FROM fields
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;
