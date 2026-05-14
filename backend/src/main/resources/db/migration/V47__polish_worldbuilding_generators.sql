WITH data(code, name, description, category_code, type_code, display_order, icon_key, variant_code, setting_code) AS (
  VALUES
    ('fantasy_world', 'Swiat fantasy', 'Generuje swiat fantasy: wiek, magie, geografie, konflikt, krolestwo i sekret.', 'FANTASY', 'world', 240, 'planet', 'fantasy.quick', 'fantasy'),
    ('calendar_fantasy', 'Kalendarz fantasy', 'Generuje kalendarz swiata: dni tygodnia, miesiace, pory roku, ksiezyce i swieta.', 'FANTASY', 'worldbuilding', 250, 'clock', 'fantasy.quick', 'fantasy'),
    ('demographics_fantasy', 'Demografia sredniowieczna', 'Generuje opisowa demografie osady: populacje, grupy, zawody, jezyki i religie.', 'FANTASY', 'settlement', 260, 'users', 'fantasy.quick', 'fantasy'),
    ('castle_fantasy', 'Zamek fantasy', 'Generuje zamek albo twierdze: typ, stan, cechy, wladce, problem i sekret.', 'FANTASY', 'location', 270, 'castle', 'fantasy.quick', 'fantasy'),
    ('five_room_dungeon', 'Loch pieciu pomieszczen', 'Generuje pieciopokojowy loch z opisem kazdego pokoju i prosta mapka.', 'FANTASY', 'location', 280, 'map', 'fantasy.quick', 'fantasy'),
    ('coc_investigator_npc', 'NPC grozy sledczej', 'Generuje opisowego NPC do horroru sledczego: zawod, obsesje, sekret, trop i stan psychiczny.', 'HORROR', 'npc', 135, 'eye', 'horror.quick', 'horror'),
    ('scifi_world', 'Swiat sci-fi', 'Generuje swiat albo planete sci-fi: technologia, rzad, kultura, konflikt, sekret i haczyk.', 'SCIFI', 'world', 135, 'planet', 'scifi.quick', 'scifi'),
    ('star_system', 'System gwiezdny', 'Generuje system gwiezdny: gwiazde, planety, zagrozenia, punkty zainteresowania i frakcje.', 'SCIFI', 'location', 145, 'planet', 'scifi.quick', 'scifi')
)
INSERT INTO generator_definitions (
  code, name, description, category, icon,
  category_code, type_code, genre_tags, system_tags, tone_tags,
  display_order, icon_key, is_active
)
SELECT
  code, name, description, 'SETTING', icon_key,
  category_code, type_code, jsonb_build_array(lower(category_code)), '["system_agnostic"]'::jsonb,
  CASE category_code
    WHEN 'HORROR' THEN '["investigation_horror","cosmic_horror","psychological_horror"]'::jsonb
    WHEN 'SCIFI' THEN '["space_opera","hard_scifi","space_horror","dystopia","corporate_scifi"]'::jsonb
    ELSE '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb
  END,
  display_order, icon_key, true
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
    is_active = true,
    updated_at = now();

WITH data(code, name, description, category_code, variant_code, setting_code) AS (
  VALUES
    ('fantasy_world', 'Swiat fantasy', 'Szybki generator swiata fantasy bez mechaniki systemowej.', 'FANTASY', 'fantasy.quick', 'fantasy'),
    ('calendar_fantasy', 'Kalendarz fantasy', 'Szybki generator kalendarza fantasy do worldbuildingu.', 'FANTASY', 'fantasy.quick', 'fantasy'),
    ('demographics_fantasy', 'Demografia sredniowieczna', 'Szybki generator populacji i struktury osady.', 'FANTASY', 'fantasy.quick', 'fantasy'),
    ('castle_fantasy', 'Zamek fantasy', 'Szybki generator zamku, twierdzy albo warowni.', 'FANTASY', 'fantasy.quick', 'fantasy'),
    ('five_room_dungeon', 'Loch pieciu pomieszczen', 'Szybki generator pieciopokojowego lochu z mapka.', 'FANTASY', 'fantasy.quick', 'fantasy'),
    ('coc_investigator_npc', 'NPC grozy sledczej', 'Szybki generator NPC do horroru sledczego bez procentowych statystyk.', 'HORROR', 'horror.quick', 'horror'),
    ('scifi_world', 'Swiat sci-fi', 'Szybki generator swiata sci-fi bez mechaniki systemowej.', 'SCIFI', 'scifi.quick', 'scifi'),
    ('star_system', 'System gwiezdny', 'Szybki generator systemu gwiezdnego.', 'SCIFI', 'scifi.quick', 'scifi')
)
INSERT INTO generator_variants (
  generator_definition_id, variant_code, system_code, setting_code,
  category_code, tone_scope, mode, name, description, is_active
)
SELECT
  gd.id, data.variant_code, 'system_agnostic', data.setting_code,
  data.category_code,
  CASE data.category_code
    WHEN 'HORROR' THEN '["investigation_horror","cosmic_horror","psychological_horror"]'::jsonb
    WHEN 'SCIFI' THEN '["space_opera","hard_scifi","space_horror","dystopia","corporate_scifi"]'::jsonb
    ELSE '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb
  END,
  'quick', data.name, data.description, true
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
    is_active = true;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code IN (
    'fantasy_world','calendar_fantasy','demographics_fantasy','castle_fantasy',
    'five_room_dungeon','coc_investigator_npc','scifi_world','star_system'
  )
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'tone', 'Ton', 'SELECT', '["Losowy","Jasny","Przygodowy","Mroczny","Ponury","Niepokojacy"]'::jsonb, 'Losowy', false, 10 FROM variants
UNION ALL
SELECT id, 'scale', 'Skala', 'SELECT', '["Losowa","Mala","Srednia","Duza","Epicka"]'::jsonb, 'Losowa', false, 20 FROM variants WHERE code IN ('fantasy_world','scifi_world','star_system')
UNION ALL
SELECT id, 'size', 'Rozmiar osady', 'SELECT', '["Losowy","Przysiolek","Wies","Miasteczko","Miasto","Metropolia"]'::jsonb, 'Losowy', false, 20 FROM variants WHERE code = 'demographics_fantasy'
UNION ALL
SELECT id, 'castleType', 'Typ zamku', 'SELECT', '["Losowy","Warownia na wzgorzu","Twierdza nad rzeka","Zamek graniczny","Nadmorska forteca","Ruina po oblezeniu"]'::jsonb, 'Losowy', false, 20 FROM variants WHERE code = 'castle_fantasy'
UNION ALL
SELECT id, 'theme', 'Motyw lochu', 'SELECT', '["Losowy","Krypta","Kopalnia","Swiatynia","Wieza maga","Kryjowka bandytow","Ruiny krasnoludzkie"]'::jsonb, 'Losowy', false, 20 FROM variants WHERE code = 'five_room_dungeon'
UNION ALL
SELECT id, 'occupationGroup', 'Grupa zawodowa', 'SELECT', '["Losowa","Sledczy","Uczony","Elita","Mistyk","Twardziel","Zwykly swiadek"]'::jsonb, 'Losowa', false, 20 FROM variants WHERE code = 'coc_investigator_npc'
UNION ALL
SELECT id, 'planetCount', 'Liczba planet', 'SELECT', '["Losowa","2","3","4","5","6"]'::jsonb, 'Losowa', false, 30 FROM variants WHERE code = 'star_system'
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;
