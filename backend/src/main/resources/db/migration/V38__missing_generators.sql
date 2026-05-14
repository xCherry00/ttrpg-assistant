-- ============================================================
-- FANTASY: 5 missing generators
-- ============================================================
WITH data(code, name, description, type_code, display_order, icon_key) AS (
  VALUES
    ('npc_fantasy',       'NPC Fantasy',        'Generuje postac niezalezna fantasy z rasa, profesja, motywacja i sekretem.',      'npc',      190, 'hood'),
    ('encounter_fantasy', 'Spotkanie fantasy',  'Generuje spotkanie fabularne albo bojowe bez twardego liczenia mechaniki.',       'encounter', 200, 'swords'),
    ('trap_fantasy',      'Pulapka fantasy',    'Generuje pulapke z opisem, aktywatorem, efektem i sposobem ominieccia.',          'threat',    210, 'gear'),
    ('loot_fantasy',      'Skarb fantasy',      'Generuje skarb z pochodzeniem, wartoscia, haczykiem fabularnym i wlascicielem.', 'item',      220, 'chest'),
    ('faction_fantasy',   'Frakcja fantasy',    'Generuje kult, zakon, gildie, rod albo kompanie z celem i metodami dzialania.',  'faction',   230, 'shield')
)
INSERT INTO generator_definitions (
  code, name, description, category, icon,
  category_code, type_code, genre_tags, system_tags, tone_tags,
  display_order, icon_key, is_active
)
SELECT
  code, name, description, 'SETTING', icon_key,
  'FANTASY', type_code,
  '["fantasy"]'::jsonb,
  '["system_agnostic","dnd5e","pf2e","wfrp4e","morkborg"]'::jsonb,
  '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb,
  display_order, icon_key, true
FROM data
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
    icon = EXCLUDED.icon, category_code = EXCLUDED.category_code, type_code = EXCLUDED.type_code,
    genre_tags = EXCLUDED.genre_tags, system_tags = EXCLUDED.system_tags, tone_tags = EXCLUDED.tone_tags,
    display_order = EXCLUDED.display_order, icon_key = EXCLUDED.icon_key, is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (
  generator_definition_id, variant_code, system_code, setting_code,
  category_code, tone_scope, mode, name, description, is_active
)
SELECT
  gd.id, 'fantasy.quick', 'system_agnostic', 'fantasy', 'FANTASY',
  '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb,
  'quick', gd.name || ' szybki', gd.description, true
FROM generator_definitions gd
WHERE gd.code IN ('npc_fantasy','encounter_fantasy','trap_fantasy','loot_fantasy','faction_fantasy')
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code,
    category_code = EXCLUDED.category_code, tone_scope = EXCLUDED.tone_scope,
    mode = EXCLUDED.mode, name = EXCLUDED.name, description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'fantasy.quick'
    AND gd.code IN ('npc_fantasy','encounter_fantasy','trap_fantasy','loot_fantasy','faction_fantasy')
),
fields AS (
  SELECT id, 'tone' AS field_key, 'Klimat' AS label, 'SELECT' AS type,
         '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb AS options_json,
         'dark_fantasy' AS default_value, true AS required, 10 AS order_index FROM variants
  UNION ALL
  SELECT id, 'system', 'System', 'SELECT',
         '["system_agnostic","dnd5e","pf2e","wfrp4e","morkborg"]'::jsonb,
         'system_agnostic', true, 20 FROM variants
  UNION ALL
  SELECT id, 'race', 'Rasa', 'SELECT',
         '["Losowa","Czlowiek","Elf","Krasnolud","Tiefling","Polork","Niziolek"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'npc_fantasy'
  UNION ALL
  SELECT id, 'profession', 'Profesja', 'SELECT',
         '["Losowa","Straznik","Kapłan","Zlodziej","Mag","Kupiec","Szlachcic","Zolnierz"]'::jsonb,
         'Losowa', false, 40 FROM variants WHERE code = 'npc_fantasy'
  UNION ALL
  SELECT id, 'encounterType', 'Typ spotkania', 'SELECT',
         '["Losowy","Bojowe","Spoleczne","Eksploracja","Pogon","Negocjacje"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'encounter_fantasy'
  UNION ALL
  SELECT id, 'trapType', 'Typ pulapki', 'SELECT',
         '["Losowa","Mechaniczna","Magiczna","Spoleczna","Srodowiskowa"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'trap_fantasy'
  UNION ALL
  SELECT id, 'lootType', 'Typ skarbu', 'SELECT',
         '["Losowy","Pieniadze","Magiczny przedmiot","Dokumenty","Relikwia","Ekwipunek"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'loot_fantasy'
  UNION ALL
  SELECT id, 'factionType', 'Typ frakcji', 'SELECT',
         '["Losowa","Kult","Gildia","Zakon","Rod","Kompania"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'faction_fantasy'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, field_key, label, type, options_json, default_value, required, order_index
FROM fields
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

-- ============================================================
-- HORROR: 9 missing generators
-- ============================================================
WITH data(code, name, description, type_code, display_order, icon_key, system_tags, tone_tags) AS (
  VALUES
    ('suspect',              'Podejrzany',          'Generuje podejrzanego z motywem, alibi, zachowaniem i ukryta prawda.',                'npc',      50, 'hood',   '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","psychological_horror","investigation_horror","urban_horror"]'::jsonb),
    ('witness',              'Swiadek',             'Generuje swiadka, co widzial, co ukrywa i jak go przekonac.',                         'npc',      60, 'hood',   '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","psychological_horror","investigation_horror"]'::jsonb),
    ('victim',               'Ofiara',              'Generuje ofiare, ostatnie dzialania, slady i sekret powiazany z zagrozeniem.',        'npc',      70, 'hood',   '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","psychological_horror","investigation_horror","survival_horror"]'::jsonb),
    ('investigation_location','Miejsce sledztwa',   'Generuje lokacje sledztwa z tropem, falszywym sladem i ukrytym zagrozeniem.',        'location', 80, 'castle', '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","investigation_horror"]'::jsonb),
    ('ritual',               'Rytual',              'Generuje rytual, wymagania, przebieg i sposob przerwania.',                           'threat',   90, 'scroll', '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","religious_horror"]'::jsonb),
    ('artifact_horror',      'Artefakt horror',     'Generuje artefakt z historia, efektem, kosztem uzywania i tym, kto go szuka.',       'item',    100, 'chest',  '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","psychological_horror"]'::jsonb),
    ('omen',                 'Omen',                'Generuje zly omen, kiedy wystepuje, co zapowiada i jak reaguje otoczenie.',           'threat',  110, 'eye',    '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","folk_horror","religious_horror","psychological_horror"]'::jsonb),
    ('horror_document',      'Dokument horror',     'Generuje dokument, autora, ukryty sens i niepokojacy szczegol.',                     'document', 120, 'scroll', '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","psychological_horror","investigation_horror"]'::jsonb),
    ('horror_escalation',    'Eskalacja horroru',   'Generuje etap narastania horroru: co sie zmienia, efekty i co nastapi potem.',       'story',   130, 'spark',  '["system_agnostic","coc7e"]'::jsonb, '["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","survival_horror"]'::jsonb)
)
INSERT INTO generator_definitions (
  code, name, description, category, icon,
  category_code, type_code, genre_tags, system_tags, tone_tags,
  display_order, icon_key, is_active
)
SELECT
  code, name, description, 'SETTING', icon_key,
  'HORROR', type_code,
  '["horror"]'::jsonb,
  system_tags, tone_tags,
  display_order, icon_key, true
FROM data
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
    icon = EXCLUDED.icon, category_code = EXCLUDED.category_code, type_code = EXCLUDED.type_code,
    genre_tags = EXCLUDED.genre_tags, system_tags = EXCLUDED.system_tags, tone_tags = EXCLUDED.tone_tags,
    display_order = EXCLUDED.display_order, icon_key = EXCLUDED.icon_key, is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (
  generator_definition_id, variant_code, system_code, setting_code,
  category_code, tone_scope, mode, name, description, is_active
)
SELECT
  gd.id, 'horror.quick', 'system_agnostic', 'horror', 'HORROR',
  '["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","investigation_horror","survival_horror"]'::jsonb,
  'quick', gd.name || ' szybki', gd.description, true
FROM generator_definitions gd
WHERE gd.code IN ('suspect','witness','victim','investigation_location','ritual','artifact_horror','omen','horror_document','horror_escalation')
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code,
    category_code = EXCLUDED.category_code, tone_scope = EXCLUDED.tone_scope,
    mode = EXCLUDED.mode, name = EXCLUDED.name, description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'horror.quick'
    AND gd.code IN ('suspect','witness','victim','investigation_location','ritual','artifact_horror','omen','horror_document','horror_escalation')
),
fields AS (
  SELECT id, 'tone' AS field_key, 'Klimat' AS label, 'SELECT' AS type,
         '["cosmic_horror","occult_horror","folk_horror","body_horror","psychological_horror","investigation_horror","survival_horror"]'::jsonb AS options_json,
         'investigation_horror' AS default_value, true AS required, 10 AS order_index FROM variants
  UNION ALL
  SELECT id, 'system', 'System', 'SELECT',
         '["system_agnostic","coc7e"]'::jsonb,
         'system_agnostic', true, 20 FROM variants
  UNION ALL
  SELECT id, 'guiltLevel', 'Poziom winy', 'SELECT',
         '["Losowy","Niewinny","Podejrzany","Winny","Wspolnik"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'suspect'
  UNION ALL
  SELECT id, 'mentalState', 'Stan psychiczny', 'SELECT',
         '["Stabilny","Wstrzasniety","Zaprzeczajacy","Nieprzytomny"]'::jsonb,
         'Wstrzasniety', false, 30 FROM variants WHERE code = 'witness'
  UNION ALL
  SELECT id, 'victimState', 'Stan ofiary', 'SELECT',
         '["Znaleziona","Zaginiona","Ocala","Ostatnia z wielu"]'::jsonb,
         'Znaleziona', false, 30 FROM variants WHERE code = 'victim'
  UNION ALL
  SELECT id, 'locationType', 'Typ lokacji', 'SELECT',
         '["Losowa","Dom","Piwnica","Archiwum","Kaplica","Las","Szpital"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'investigation_location'
  UNION ALL
  SELECT id, 'ritualStage', 'Etap rytualu', 'SELECT',
         '["Przygotowanie","W trakcie","Zakonczone","Przerwane"]'::jsonb,
         'W trakcie', false, 30 FROM variants WHERE code = 'ritual'
  UNION ALL
  SELECT id, 'artifactType', 'Typ artefaktu', 'SELECT',
         '["Losowy","Ksiega","Bizuteria","Narzedzie","Pojemnik","Obraz"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'artifact_horror'
  UNION ALL
  SELECT id, 'omenType', 'Typ omenu', 'SELECT',
         '["Losowy","Dzwiekowy","Wizualny","Fizyczny","Snowy","Behawioralny"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'omen'
  UNION ALL
  SELECT id, 'documentType', 'Typ dokumentu', 'SELECT',
         '["Losowy","List","Dziennik","Raport","Nagranie","Szkic"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'horror_document'
  UNION ALL
  SELECT id, 'stage', 'Etap horroru', 'SELECT',
         '["Wczesny","Srodkowy","Szczytowy","Po szczycie"]'::jsonb,
         'Srodkowy', false, 30 FROM variants WHERE code = 'horror_escalation'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, field_key, label, type, options_json, default_value, required, order_index
FROM fields
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

-- ============================================================
-- POSTAPO: 9 missing generators
-- ============================================================
WITH data(code, name, description, type_code, display_order, icon_key) AS (
  VALUES
    ('survivor_group',       'Grupa ocalalych',      'Generuje grupe ocalalych z liderem, zasobami i wewnetrznym konfliktem.',          'faction',  50, 'shield'),
    ('supplies',             'Zapasy',               'Generuje znalezione zasoby, ilosc, problem i kto jeszcze ich szuka.',              'item',     60, 'chest'),
    ('postapo_location',     'Lokacja postapo',      'Generuje opuszczone miejsce z zagrozeniem, ukrytym zasobem i sladem przeszlosci.','location', 70, 'castle'),
    ('horde',                'Horda',                'Generuje horde, kierunek, co ja przyciaga i mozliwe rozwiazania.',                 'threat',   80, 'swords'),
    ('postapo_conflict',     'Konflikt postapo',     'Generuje konflikt miedzy stronami, powod, eskalacje i mozliwe wyjscia.',           'story',    90, 'scroll'),
    ('moral_dilemma',        'Dylemat moralny',      'Generuje trudna decyzje z dwoma opcjami, kosztem kazdej i pozniejszymi skutkami.','story',   100, 'scroll'),
    ('postapo_event',        'Wydarzenie postapo',   'Generuje niespodziewane wydarzenie, natychmiastowy problem i konsekwencje.',       'story',   110, 'spark'),
    ('disease_contamination','Choroba / skazenie',   'Generuje chorobe, objawy, zrodlo, sposob spowolnienia i skutki dla grupy.',       'threat',  120, 'eye'),
    ('vehicle_wreck',        'Wrak pojazdu',         'Generuje wrak, co dziala, co mozna znalezc i kto moze po niego przyjsc.',         'item',    130, 'chest')
)
INSERT INTO generator_definitions (
  code, name, description, category, icon,
  category_code, type_code, genre_tags, system_tags, tone_tags,
  display_order, icon_key, is_active
)
SELECT
  code, name, description, 'SETTING', icon_key,
  'POSTAPO', type_code,
  '["postapo"]'::jsonb,
  '["system_agnostic"]'::jsonb,
  '["zombie_apocalypse","survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb,
  display_order, icon_key, true
FROM data
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
    icon = EXCLUDED.icon, category_code = EXCLUDED.category_code, type_code = EXCLUDED.type_code,
    genre_tags = EXCLUDED.genre_tags, system_tags = EXCLUDED.system_tags, tone_tags = EXCLUDED.tone_tags,
    display_order = EXCLUDED.display_order, icon_key = EXCLUDED.icon_key, is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (
  generator_definition_id, variant_code, system_code, setting_code,
  category_code, tone_scope, mode, name, description, is_active
)
SELECT
  gd.id, 'postapo.quick', 'system_agnostic', 'postapo', 'POSTAPO',
  '["zombie_apocalypse","survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb,
  'quick', gd.name || ' szybki', gd.description, true
FROM generator_definitions gd
WHERE gd.code IN ('survivor_group','supplies','postapo_location','horde','postapo_conflict','moral_dilemma','postapo_event','disease_contamination','vehicle_wreck')
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code,
    category_code = EXCLUDED.category_code, tone_scope = EXCLUDED.tone_scope,
    mode = EXCLUDED.mode, name = EXCLUDED.name, description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'postapo.quick'
    AND gd.code IN ('survivor_group','supplies','postapo_location','horde','postapo_conflict','moral_dilemma','postapo_event','disease_contamination','vehicle_wreck')
),
fields AS (
  SELECT id, 'tone' AS field_key, 'Klimat' AS label, 'SELECT' AS type,
         '["zombie_apocalypse","survival_drama","wasteland","ruined_city","road_survival","plague_apocalypse"]'::jsonb AS options_json,
         'survival_drama' AS default_value, true AS required, 10 AS order_index FROM variants
  UNION ALL
  SELECT id, 'system', 'System', 'SELECT',
         '["system_agnostic"]'::jsonb,
         'system_agnostic', true, 20 FROM variants
  UNION ALL
  SELECT id, 'groupType', 'Typ grupy', 'SELECT',
         '["Losowa","Milicja","Klan","Kult","Wolne miasto","Nomadzi"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'survivor_group'
  UNION ALL
  SELECT id, 'supplyType', 'Typ zasobow', 'SELECT',
         '["Losowy","Medyczny","Zywnosciowy","Techniczny","Obronny","Paliwowy"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'supplies'
  UNION ALL
  SELECT id, 'locationType', 'Typ lokacji', 'SELECT',
         '["Losowa","Ruiny miejskie","Autostrada","Bunkier","Farma","Fabryka"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'postapo_location'
  UNION ALL
  SELECT id, 'size', 'Rozmiar hordy', 'SELECT',
         '["Mala","Srednia","Duza","Masowa"]'::jsonb,
         'Srednia', false, 30 FROM variants WHERE code = 'horde'
  UNION ALL
  SELECT id, 'conflictType', 'Typ konfliktu', 'SELECT',
         '["Losowy","O terytorium","O zasoby","Ideologiczny","Personalny"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'postapo_conflict'
  UNION ALL
  SELECT id, 'decisionWeight', 'Waga decyzji', 'SELECT',
         '["Lokalna","Grupowa","Strategiczna"]'::jsonb,
         'Grupowa', false, 30 FROM variants WHERE code = 'moral_dilemma'
  UNION ALL
  SELECT id, 'eventType', 'Typ wydarzenia', 'SELECT',
         '["Losowe","Migracja","Atak","Choroba","Anomalia","Handel"]'::jsonb,
         'Losowe', false, 30 FROM variants WHERE code = 'postapo_event'
  UNION ALL
  SELECT id, 'severity', 'Powaznosc', 'SELECT',
         '["Lagodna","Srednia","Ciezka","Smiertelna"]'::jsonb,
         'Srednia', false, 30 FROM variants WHERE code = 'disease_contamination'
  UNION ALL
  SELECT id, 'vehicleType', 'Typ pojazdu', 'SELECT',
         '["Losowy","Samochod","Ciezarowka","Autobus","Motor","Pojazd wojskowy"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'vehicle_wreck'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, field_key, label, type, options_json, default_value, required, order_index
FROM fields
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

-- ============================================================
-- SCIFI: 9 missing generators
-- ============================================================
WITH data(code, name, description, type_code, display_order, icon_key, system_tags, tone_tags) AS (
  VALUES
    ('starship',        'Statek kosmiczny',    'Generuje statek, problem techniczny, ladune i sekret zalogi.',                       'location', 50, 'rocket', '["system_agnostic","alien","mothership"]'::jsonb,                     '["space_opera","hard_scifi","space_horror","dystopia","military_scifi"]'::jsonb),
    ('colony',          'Kolonia',             'Generuje kolonie, zarzadce, zasoby, konflikt i zagrozenie.',                         'settlement',60, 'castle', '["system_agnostic","alien","mothership","starfinder"]'::jsonb,          '["space_opera","hard_scifi","dystopia","corporate_scifi","exploration_scifi"]'::jsonb),
    ('corporation',     'Korporacja',          'Generuje korporacje, produkt, metody dzialania, sekret i wroga.',                    'faction',  70, 'shield', '["system_agnostic","alien","cyberpunk","starfinder"]'::jsonb,           '["cyberpunk","corporate_scifi","dystopia","space_opera"]'::jsonb),
    ('scifi_mission',   'Misja sci-fi',        'Generuje misje z celem, lokacja, zagrozeniem, komplikacja i nagroda.',               'quest',    80, 'scroll', '["system_agnostic","alien","mothership","starfinder"]'::jsonb,          '["space_opera","hard_scifi","cyberpunk","space_horror","dystopia","corporate_scifi"]'::jsonb),
    ('alien_organism',  'Obcy organizm',       'Generuje obcy organizm z cyklem zycia, zachowaniem, zagrozeniem i slaboscia.',       'creature', 90, 'eye',    '["system_agnostic","alien","mothership"]'::jsonb,                     '["space_opera","hard_scifi","space_horror","exploration_scifi"]'::jsonb),
    ('technology',      'Technologia',         'Generuje technologie, funkcje, wade i kto jej szuka.',                               'item',    100, 'gear',   '["system_agnostic","alien","mothership","cyberpunk"]'::jsonb,          '["hard_scifi","cyberpunk","corporate_scifi","dystopia"]'::jsonb),
    ('cyberware',       'Cyberwzmocnienie',    'Generuje cyberwzmocnienie, efekt uboczny, producenta i nielegalna modyfikacje.',     'item',    110, 'gear',   '["system_agnostic","cyberpunk"]'::jsonb,                              '["cyberpunk","corporate_scifi","dystopia","post_cyberpunk"]'::jsonb),
    ('system_failure',  'Awaria systemu',      'Generuje awarie systemu, objawy, konsekwencje i co utrudnia naprawe.',               'threat',  120, 'spark',  '["system_agnostic","alien","mothership"]'::jsonb,                     '["hard_scifi","space_horror","dystopia","corporate_scifi"]'::jsonb),
    ('ship_threat',     'Zagrozenie na statek','Generuje zagrozenie na pokladzie, pierwsze oznaki, eskalacje i mozliwe wyjscie.',   'threat',  130, 'swords', '["system_agnostic","alien","mothership"]'::jsonb,                     '["space_opera","hard_scifi","space_horror","military_scifi"]'::jsonb)
)
INSERT INTO generator_definitions (
  code, name, description, category, icon,
  category_code, type_code, genre_tags, system_tags, tone_tags,
  display_order, icon_key, is_active
)
SELECT
  code, name, description, 'SETTING', icon_key,
  'SCIFI', type_code,
  '["scifi"]'::jsonb,
  system_tags, tone_tags,
  display_order, icon_key, true
FROM data
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
    icon = EXCLUDED.icon, category_code = EXCLUDED.category_code, type_code = EXCLUDED.type_code,
    genre_tags = EXCLUDED.genre_tags, system_tags = EXCLUDED.system_tags, tone_tags = EXCLUDED.tone_tags,
    display_order = EXCLUDED.display_order, icon_key = EXCLUDED.icon_key, is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (
  generator_definition_id, variant_code, system_code, setting_code,
  category_code, tone_scope, mode, name, description, is_active
)
SELECT
  gd.id, 'scifi.quick', 'system_agnostic', 'scifi', 'SCIFI',
  '["space_opera","hard_scifi","cyberpunk","space_horror","dystopia","corporate_scifi"]'::jsonb,
  'quick', gd.name || ' szybki', gd.description, true
FROM generator_definitions gd
WHERE gd.code IN ('starship','colony','corporation','scifi_mission','alien_organism','technology','cyberware','system_failure','ship_threat')
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code,
    category_code = EXCLUDED.category_code, tone_scope = EXCLUDED.tone_scope,
    mode = EXCLUDED.mode, name = EXCLUDED.name, description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variants AS (
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'scifi.quick'
    AND gd.code IN ('starship','colony','corporation','scifi_mission','alien_organism','technology','cyberware','system_failure','ship_threat')
),
fields AS (
  SELECT id, 'tone' AS field_key, 'Klimat' AS label, 'SELECT' AS type,
         '["space_opera","hard_scifi","cyberpunk","space_horror","dystopia","corporate_scifi"]'::jsonb AS options_json,
         'space_horror' AS default_value, true AS required, 10 AS order_index FROM variants
  UNION ALL
  SELECT id, 'system', 'System', 'SELECT',
         '["system_agnostic","alien","mothership","cyberpunk","starfinder"]'::jsonb,
         'system_agnostic', true, 20 FROM variants
  UNION ALL
  SELECT id, 'shipType', 'Typ statku', 'SELECT',
         '["Losowy","Handlowy","Wojskowy","Badawczy","Przemytniczy","Zniszczony"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'starship'
  UNION ALL
  SELECT id, 'colonyType', 'Typ kolonii', 'SELECT',
         '["Losowa","Korporacyjna","Niezalezna","Wojskowa","Naukowa","Wiezienna"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'colony'
  UNION ALL
  SELECT id, 'industry', 'Branza', 'SELECT',
         '["Losowa","Zbrojeniowa","Farmaceutyczna","Wydobywcza","Technologiczna","Medialna"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'corporation'
  UNION ALL
  SELECT id, 'missionType', 'Typ misji', 'SELECT',
         '["Losowa","Odzysk","Ochrona","Eksploracja","Infiltracja","Dostawa"]'::jsonb,
         'Losowa', false, 30 FROM variants WHERE code = 'scifi_mission'
  UNION ALL
  SELECT id, 'aggression', 'Agresywnosc', 'SELECT',
         '["Bierna","Terytorialna","Agresywna","Drapiezna"]'::jsonb,
         'Terytorialna', false, 30 FROM variants WHERE code = 'alien_organism'
  UNION ALL
  SELECT id, 'technologyType', 'Typ technologii', 'SELECT',
         '["Losowy","Zbrojenie","AI","Interfejs","Transport","Medyczny"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'technology'
  UNION ALL
  SELECT id, 'quality', 'Jakosc', 'SELECT',
         '["Wojskowy","Przemyslowy","Nielegalny","Eksperymentalny"]'::jsonb,
         'Przemyslowy', false, 30 FROM variants WHERE code = 'cyberware'
  UNION ALL
  SELECT id, 'affectedSystem', 'Dotkniety system', 'SELECT',
         '["Losowy","Podtrzymywanie zycia","Naped","Komunikacja","Bezpieczenstwo","Dane"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'system_failure'
  UNION ALL
  SELECT id, 'threatType', 'Typ zagrozenia', 'SELECT',
         '["Losowy","Wewnetrzny","Zewnetrzny","Biologiczny","Mechaniczny"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'ship_threat'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, field_key, label, type, options_json, default_value, required, order_index
FROM fields
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;
