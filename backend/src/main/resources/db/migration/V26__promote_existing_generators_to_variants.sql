INSERT INTO generator_definitions (code, name, description, category, icon, is_active)
VALUES
  ('name', 'Imiona', 'Generuje imiona i nazwiska z pul kulturowych.', 'GENERAL', 'layers', true),
  ('loot', 'Skarb / przedmiot', 'Generuje skarby, kosztowności i znaleziska systemowe.', 'SYSTEM', 'briefcase', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (
  generator_definition_id,
  variant_code,
  system_code,
  setting_code,
  mode,
  name,
  description,
  is_active
)
SELECT gd.id, 'general.quick', 'any', 'none', 'quick', 'Imiona ogólne', 'Lista imion i nazwisk według kultury oraz płci.', true
FROM generator_definitions gd
WHERE gd.code = 'name'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    mode = EXCLUDED.mode,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

INSERT INTO generator_variants (
  generator_definition_id,
  variant_code,
  system_code,
  setting_code,
  mode,
  name,
  description,
  is_active
)
SELECT gd.id, 'dnd.quick', 'dnd', 'none', 'quick', 'NPC D&D 5E', 'Postać z wyglądem, osobowością, sekretem, motywacją i uproszczonym stat blockiem.', true
FROM generator_definitions gd
WHERE gd.code = 'npc'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    mode = EXCLUDED.mode,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

INSERT INTO generator_variants (
  generator_definition_id,
  variant_code,
  system_code,
  setting_code,
  mode,
  name,
  description,
  is_active
)
SELECT gd.id, 'dnd.quick', 'dnd', 'none', 'quick', 'Skarb D&D 5E', 'Skarb w stylu Donjon/Kassoon: monety, kosztowności, przedmioty, magia i miejsce ukrycia.', true
FROM generator_definitions gd
WHERE gd.code = 'loot'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code,
    setting_code = EXCLUDED.setting_code,
    mode = EXCLUDED.mode,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'name' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'culture', 'Kultura', 'SELECT', '["Losowa","Słowiańska","Nordycka","Arabska","Japońska","Elficka","Krasnoludzka","Orcza","Fantastyczna"]'::jsonb, 'Losowa', false, 10 FROM variant
UNION ALL
SELECT id, 'gender', 'Płeć', 'SELECT', '["Losowa","Męska","Żeńska","Neutralna"]'::jsonb, 'Losowa', false, 20 FROM variant
UNION ALL
SELECT id, 'count', 'Liczba wyników', 'NUMBER', '[]'::jsonb, '3', false, 30 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'npc' AND gv.variant_code = 'dnd.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'race', 'Rasa', 'SELECT', '["Losowa","Człowiek","Elf","Krasnolud","Niziołek","Gnom","Półelf","Półork","Tiefling","Dragonborn"]'::jsonb, 'Losowa', false, 10 FROM variant
UNION ALL
SELECT id, 'profession', 'Profesja/Klasa', 'SELECT', '["Losowa","Strażnik","Kupiec","Wiedźma","Złodziej","Kapłan","Szlachcic","Chłop","Żołnierz","Magik","Łowca nagród","Skryba","Alchemik"]'::jsonb, 'Losowa', false, 20 FROM variant
UNION ALL
SELECT id, 'role', 'Rola fabularna', 'SELECT', '["Losowa","Villain","Quest Giver","Ally","Contact","Neutral","Rival","Informant"]'::jsonb, 'Losowa', false, 30 FROM variant
UNION ALL
SELECT id, 'alignment', 'Charakter', 'SELECT', '["Losowy","Lawful Good","Neutral Good","Chaotic Good","Lawful Neutral","True Neutral","Chaotic Neutral","Lawful Evil","Neutral Evil","Chaotic Evil"]'::jsonb, 'Losowy', false, 40 FROM variant
UNION ALL
SELECT id, 'level', 'Poziom', 'NUMBER', '[]'::jsonb, '5', false, 50 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'loot' AND gv.variant_code = 'dnd.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'treasureType', 'Typ skarbu', 'SELECT', '["Individual Loot","Treasure Hoard"]'::jsonb, 'Treasure Hoard', false, 10 FROM variant
UNION ALL
SELECT id, 'crBand', 'CR / poziom skarbca', 'SELECT', '["0-4","5-10","11-16","17+"]'::jsonb, '0-4', false, 20 FROM variant
UNION ALL
SELECT id, 'contents', 'Zawartość', 'SELECT', '["Wszystko","Monety","Kosztowności","Magiczne"]'::jsonb, 'Wszystko', false, 30 FROM variant
UNION ALL
SELECT id, 'theme', 'Motyw', 'SELECT', '["Podziemie","Szlachta","Religijny","Dzicz","Arkana"]'::jsonb, 'Podziemie', false, 40 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;
