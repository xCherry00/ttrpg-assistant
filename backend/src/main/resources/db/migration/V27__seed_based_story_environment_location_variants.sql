INSERT INTO generator_definitions (code, name, description, category, icon, is_active)
VALUES
  ('weather', 'Pogoda', 'Generuje pogodę, nastrój i drobny efekt sceniczny.', 'GENERAL', 'cloud', true),
  ('hook', 'Haczyk sesji', 'Generuje start sceny, trop albo zlecenie.', 'GENERAL', 'sparkles', true),
  ('twist', 'Twist', 'Generuje szybki zwrot sytuacji do sceny.', 'GENERAL', 'shuffle', true),
  ('location', 'Lokacja', 'Generuje lokacje do scen, podróży i kampanii.', 'SETTING', 'map', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (generator_definition_id, variant_code, system_code, setting_code, mode, name, description, is_active)
SELECT gd.id, 'general.quick', 'any', 'none', 'quick', 'Pogoda ogólna', 'Opis pogody z nastrojem i drobnym wpływem na scenę.', true
FROM generator_definitions gd WHERE gd.code = 'weather'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code, mode = EXCLUDED.mode,
    name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO generator_variants (generator_definition_id, variant_code, system_code, setting_code, mode, name, description, is_active)
SELECT gd.id, 'general.quick', 'any', 'none', 'quick', 'Haczyk ogólny', 'Szybki start sceny albo sesji z tropem dla drużyny.', true
FROM generator_definitions gd WHERE gd.code = 'hook'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code, mode = EXCLUDED.mode,
    name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO generator_variants (generator_definition_id, variant_code, system_code, setting_code, mode, name, description, is_active)
SELECT gd.id, 'general.quick', 'any', 'none', 'quick', 'Twist ogólny', 'Szybki zwrot do walki, negocjacji, śledztwa albo podróży.', true
FROM generator_definitions gd WHERE gd.code = 'twist'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code, mode = EXCLUDED.mode,
    name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO generator_variants (generator_definition_id, variant_code, system_code, setting_code, mode, name, description, is_active)
SELECT gd.id, 'general.quick', 'any', 'fantasy', 'quick', 'Lokacja fantasy szybka', 'Nazwa, typ, atmosfera, opis, sekret i haczyk lokacji fantasy.', true
FROM generator_definitions gd WHERE gd.code = 'location'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code, mode = EXCLUDED.mode,
    name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

WITH variant AS (
  SELECT gv.id FROM generator_variants gv JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'weather' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'climate', 'Klimat', 'SELECT', '["Losowy","Umiarkowany","Górski","Tropikalny"]'::jsonb, 'Losowy', false, 10 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id FROM generator_variants gv JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'hook' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'mood', 'Klimat', 'SELECT', '["Losowy","Tajemnica","Przygodowy","Horror"]'::jsonb, 'Losowy', false, 10 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id FROM generator_variants gv JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'twist' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'scene', 'Scena', 'SELECT', '["Losowa","Walka","Negocjacje","Śledztwo","Podróż"]'::jsonb, 'Losowa', false, 10 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id FROM generator_variants gv JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'location' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'locationType', 'Typ lokacji', 'SELECT', '["Losowy","Karczma","Sklep","Ruiny","Loch","Świątynia","Biblioteka","Port","Las","Laboratorium"]'::jsonb, 'Losowy', false, 10 FROM variant
UNION ALL
SELECT id, 'tone', 'Nastrój', 'SELECT', '["Losowy","Przygodowy","Mroczny","Tajemniczy","Dworski","Niepokojący"]'::jsonb, 'Losowy', false, 20 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

INSERT INTO generator_pools (generator_type, system_code, subtype, payload_json)
VALUES
  ('location', 'any', 'general.quick', $json$
  {
    "namePrefixes": ["Srebrny","Czarny","Stary","Zielony","Milczący","Złamany","Księżycowy","Bursztynowy"],
    "nameNouns": ["Most","Dzwon","Dzban","Próg","Kruk","Zaułek","Kamień","Ogród","Kielich","Latarnia"],
    "types": ["Karczma","Sklep","Ruiny","Loch","Świątynia","Biblioteka","Port","Las","Laboratorium"],
    "exteriors": [
      "fasada jest popękana, ale ktoś codziennie czyści próg",
      "nad wejściem wisi stary szyld kołyszący się bez wiatru",
      "okna są wąskie, a światło wewnątrz ma nienaturalnie ciepły kolor",
      "wokół leżą ślady niedawnego pośpiechu i świeże koleiny",
      "budynek wygląda skromnie, lecz drzwi mają bardzo drogi zamek"
    ],
    "interiors": [
      "w środku pachnie kurzem, świecami i mokrym drewnem",
      "każdy dźwięk odbija się tu trochę zbyt długo",
      "większość mebli ustawiono tak, jakby ktoś czekał na obronę wejścia",
      "na ścianach wiszą mapy, których nie ma w żadnym oficjalnym atlasie",
      "podłoga skrzypi tylko w miejscach, gdzie nie powinno być przejścia"
    ],
    "atmospheres": ["przytulna, ale podszyta napięciem","cicha i obserwująca","głośna, lepka od plotek","zimna mimo ognia","uroczysta i nieco fałszywa"],
    "npcs": ["zmęczony właściciel","milcząca strażniczka","nadmiernie uprzejmy skryba","dziecko znające za dużo szczegółów","podróżny z zakrwawionym rękawem"],
    "secrets": [
      "pod podłogą ukryto zejście do starszej części miasta",
      "właściciel płaci ochronę dwóm wrogim frakcjom naraz",
      "jedno z pomieszczeń nie istnieje na planach budynku",
      "ostatni gość zostawił tu wiadomość zaszyfrowaną w rachunku",
      "miejsce stoi na granicy dawnego rytuału ochronnego"
    ],
    "hooks": [
      "ktoś prosi drużynę, by została do zamknięcia",
      "ważny kontakt nie przychodzi, ale zostawia po sobie ślad",
      "właściciel oferuje nocleg w zamian za dyskretną przysługę",
      "w piwnicy słychać głos osoby, której nie powinno tu być",
      "jeden z klientów rozpoznaje bohaterów, choć nigdy ich nie spotkał"
    ],
    "hazards": ["śliska podłoga przy ukrytym przejściu","czujny informator","niestabilny strop","magiczny alarm","lokalny gang obserwujący wejście"]
  }
  $json$::jsonb)
ON CONFLICT (generator_type, system_code, subtype) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
