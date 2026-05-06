WITH data(code, name, description, type_code, display_order, icon_key) AS (
  VALUES
    ('tavern', 'Tawerna', 'Generuje tawerne z wlascicielem, plotka, problemem i klimatem.', 'location', 100, 'castle'),
    ('shop_fantasy', 'Sklep fantasy', 'Generuje sklep, wlasciciela, towary i nietypowy problem.', 'item', 110, 'chest'),
    ('settlement_fantasy', 'Osada fantasy', 'Generuje osade, wazne miejsce, problem i mozliwy quest.', 'settlement', 120, 'castle'),
    ('district_fantasy', 'Dzielnica fantasy', 'Generuje dzielnice miasta, dominujaca grupe, konflikt i sekret.', 'location', 130, 'map'),
    ('dungeon_concept', 'Koncept lochu', 'Generuje ruiny, krypte, kopalnie albo swiatynie z historia i zagrozeniem.', 'location', 140, 'gear'),
    ('dungeon_room', 'Pomieszczenie lochu', 'Generuje pojedyncze pomieszczenie, zawartosc, zagrozenie i wyjscia.', 'location', 150, 'gear'),
    ('monster_variant', 'Wariant potwora', 'Generuje wariant przeciwnika z wygladem, zachowaniem i slaboscia.', 'creature', 160, 'swords'),
    ('magic_item', 'Magiczny przedmiot', 'Generuje magiczny albo przeklety przedmiot z historia i wada.', 'item', 170, 'chest'),
    ('quest_fantasy', 'Quest fantasy', 'Generuje zadanie fantasy ze zleceniodawca, komplikacja i nagroda.', 'quest', 180, 'scroll')
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
  'FANTASY',
  type_code,
  '["fantasy"]'::jsonb,
  '["system_agnostic","dnd","dnd5e","pf2e","wfrp4e","morkborg"]'::jsonb,
  '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb,
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
  'fantasy.quick',
  'system_agnostic',
  'fantasy',
  'FANTASY',
  '["high_fantasy","low_fantasy","dark_fantasy","grimdark","heroic_fantasy","sword_and_sorcery"]'::jsonb,
  'quick',
  gd.name || ' szybki',
  gd.description,
  true
FROM generator_definitions gd
WHERE gd.code IN (
  'tavern',
  'shop_fantasy',
  'settlement_fantasy',
  'district_fantasy',
  'dungeon_concept',
  'dungeon_room',
  'monster_variant',
  'magic_item',
  'quest_fantasy'
)
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
  SELECT gd.code, gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gv.variant_code = 'fantasy.quick'
    AND gd.code IN (
      'tavern',
      'shop_fantasy',
      'settlement_fantasy',
      'district_fantasy',
      'dungeon_concept',
      'dungeon_room',
      'monster_variant',
      'magic_item',
      'quest_fantasy'
    )
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
  SELECT id, 'standard', 'Standard', 'SELECT',
         '["Losowy","Biedny","Zwykly","Bogaty","Podejrzany"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'tavern'
  UNION ALL
  SELECT id, 'shopType', 'Typ sklepu', 'SELECT',
         '["Losowy","Kowal","Alchemik","Ksiegarnia","Kram podrozny","Antykwariat"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'shop_fantasy'
  UNION ALL
  SELECT id, 'size', 'Rozmiar', 'SELECT',
         '["Osada","Wioska","Port","Klasztor","Posterunek","Male miasto"]'::jsonb,
         'Osada', false, 30 FROM variants WHERE code = 'settlement_fantasy'
  UNION ALL
  SELECT id, 'districtType', 'Typ dzielnicy', 'SELECT',
         '["Handlowa","Portowa","Swiatynna","Biedna","Szlachecka","Rzemieslnicza"]'::jsonb,
         'Handlowa', false, 30 FROM variants WHERE code = 'district_fantasy'
  UNION ALL
  SELECT id, 'dungeonType', 'Typ lochu', 'SELECT',
         '["Ruiny","Krypta","Kopalnia","Swiatynia","Wieza","Katakumby"]'::jsonb,
         'Ruiny', false, 30 FROM variants WHERE code = 'dungeon_concept'
  UNION ALL
  SELECT id, 'roomPurpose', 'Cel pomieszczenia', 'SELECT',
         '["Losowy","Straznica","Magazyn","Kaplica","Laboratorium","Cela","Skarbiec"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'dungeon_room'
  UNION ALL
  SELECT id, 'baseCreatureType', 'Bazowe stworzenie', 'SELECT',
         '["Losowe","Bestia","Nieumarly","Humanoid","Demoniczny","Konstrukt","Roslinny"]'::jsonb,
         'Losowe', false, 30 FROM variants WHERE code = 'monster_variant'
  UNION ALL
  SELECT id, 'itemType', 'Typ przedmiotu', 'SELECT',
         '["Losowy","Bron","Pierscien","Amulet","Ksiega","Latarnia","Klucz"]'::jsonb,
         'Losowy', false, 30 FROM variants WHERE code = 'magic_item'
  UNION ALL
  SELECT id, 'scale', 'Skala', 'SELECT',
         '["Lokalna","Miejska","Regionalna","Frakcyjna","Osobista"]'::jsonb,
         'Lokalna', false, 30 FROM variants WHERE code = 'quest_fantasy'
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
