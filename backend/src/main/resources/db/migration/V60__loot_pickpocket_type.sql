UPDATE generator_field_definitions gfd
SET options_json = '["Losowy","Kradzież kieszonkowa","Monety","Przedmiot","Dokument","Relikwia","Ekwipunek","Osobliwość","Klejnoty","Mapa","Klucz","Księga","Pamiątka","Składnik magiczny","Zastaw","Dowód"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'loot_fantasy'
  AND gv.variant_code = 'fantasy.quick'
  AND gfd.field_key = 'lootType';
