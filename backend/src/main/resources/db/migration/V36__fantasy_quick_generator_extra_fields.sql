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
  SELECT id, 'atmosphere' AS field_key, 'Atmosfera' AS label, 'SELECT' AS type,
         '["Losowa","Przytulna","Podejrzana","Elegancka","Gwarna","Ponura"]'::jsonb AS options_json,
         'Losowa' AS default_value, false AS required, 40 AS order_index FROM variants WHERE code = 'tavern'
  UNION ALL
  SELECT id, 'problem', 'Problem', 'SELECT',
         '["Losowy","Dlug","Zaginiecie","Przemyt","Klatwa","Szantaz"]'::jsonb,
         'Losowy', false, 50 FROM variants WHERE code = 'tavern'
  UNION ALL
  SELECT id, 'hasRareItem', 'Rzadki przedmiot', 'CHECKBOX', '[]'::jsonb,
         'true', false, 40 FROM variants WHERE code = 'shop_fantasy'
  UNION ALL
  SELECT id, 'ownerType', 'Typ wlasciciela', 'SELECT',
         '["Losowy","Rzemieslnik","Mag","Byly awanturnik","Szlachcic","Przemytnik"]'::jsonb,
         'Losowy', false, 50 FROM variants WHERE code = 'shop_fantasy'
  UNION ALL
  SELECT id, 'mainProblem', 'Glowny problem', 'SELECT',
         '["Losowy","Brak zapasow","Presja frakcji","Zaginiecia","Zaraza","Ataki z dziczy"]'::jsonb,
         'Losowy', false, 40 FROM variants WHERE code = 'settlement_fantasy'
  UNION ALL
  SELECT id, 'dominantFaction', 'Dominujaca frakcja', 'SELECT',
         '["Losowa","Rada osady","Cech","Swiatynia","Rod szlachecki","Milicja"]'::jsonb,
         'Losowa', false, 50 FROM variants WHERE code = 'settlement_fantasy'
  UNION ALL
  SELECT id, 'dangerLevel', 'Poziom zagrozenia', 'SELECT',
         '["Niski","Sredni","Wysoki"]'::jsonb,
         'Sredni', false, 40 FROM variants WHERE code IN ('district_fantasy', 'dungeon_room')
  UNION ALL
  SELECT id, 'wealthLevel', 'Zamoznosc', 'SELECT',
         '["Biedna","Mieszana","Bogata","Upadla"]'::jsonb,
         'Mieszana', false, 50 FROM variants WHERE code = 'district_fantasy'
  UNION ALL
  SELECT id, 'mainThreat', 'Glowne zagrozenie', 'SELECT',
         '["Losowe","Nieumarli","Bandyci","Kult","Bestia","Magia miejsca"]'::jsonb,
         'Losowe', false, 40 FROM variants WHERE code = 'dungeon_concept'
  UNION ALL
  SELECT id, 'currentState', 'Obecny stan', 'SELECT',
         '["Losowy","Zalane","Zawalone","Aktywne","Opuszczone","Zamieszkane"]'::jsonb,
         'Losowy', false, 50 FROM variants WHERE code = 'dungeon_concept'
  UNION ALL
  SELECT id, 'containsTreasure', 'Zawiera skarb', 'CHECKBOX', '[]'::jsonb,
         'true', false, 50 FROM variants WHERE code = 'dungeon_room'
  UNION ALL
  SELECT id, 'mutationTheme', 'Motyw wariantu', 'SELECT',
         '["Losowy","Cien","Kosc","Roslina","Mgla","Ogien","Pasozyt"]'::jsonb,
         'Losowy', false, 40 FROM variants WHERE code = 'monster_variant'
  UNION ALL
  SELECT id, 'threatLevel', 'Poziom zagrozenia', 'SELECT',
         '["Niski","Sredni","Wysoki","Boss"]'::jsonb,
         'Sredni', false, 50 FROM variants WHERE code = 'monster_variant'
  UNION ALL
  SELECT id, 'environment', 'Srodowisko', 'SELECT',
         '["Losowe","Las","Bagna","Ruiny","Lochy","Gory","Miasto"]'::jsonb,
         'Losowe', false, 60 FROM variants WHERE code = 'monster_variant'
  UNION ALL
  SELECT id, 'powerLevel', 'Poziom mocy', 'SELECT',
         '["Drobny","Uzyteczny","Silny","Niebezpieczny"]'::jsonb,
         'Uzyteczny', false, 40 FROM variants WHERE code = 'magic_item'
  UNION ALL
  SELECT id, 'isCursed', 'Przeklety', 'CHECKBOX', '[]'::jsonb,
         'true', false, 50 FROM variants WHERE code = 'magic_item'
  UNION ALL
  SELECT id, 'origin', 'Pochodzenie', 'SELECT',
         '["Losowe","Krolewski skarbiec","Ruiny","Kult","Smoczy lup","Pracownia maga"]'::jsonb,
         'Losowe', false, 60 FROM variants WHERE code = 'magic_item'
  UNION ALL
  SELECT id, 'questType', 'Typ zadania', 'SELECT',
         '["Losowy","Ratunek","Eskorta","Sledztwo","Odzyskanie","Negocjacje","Polowanie"]'::jsonb,
         'Losowy', false, 40 FROM variants WHERE code = 'quest_fantasy'
  UNION ALL
  SELECT id, 'patronType', 'Zleceniodawca', 'SELECT',
         '["Losowy","Straznik","Kupiec","Kaplanka","Szlachcic","Uchodzca","Frakcja"]'::jsonb,
         'Losowy', false, 50 FROM variants WHERE code = 'quest_fantasy'
  UNION ALL
  SELECT id, 'rewardType', 'Nagroda', 'SELECT',
         '["Losowa","Zloto","Przysluga","Informacja","Przedmiot","Bezpieczne przejscie"]'::jsonb,
         'Losowa', false, 60 FROM variants WHERE code = 'quest_fantasy'
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
