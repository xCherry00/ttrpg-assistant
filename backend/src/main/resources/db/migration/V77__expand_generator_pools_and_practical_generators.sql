UPDATE generator_definitions
SET name = CASE code
    WHEN 'name' THEN 'Generator imion'
    WHEN 'npc' THEN 'Szybki NPC'
    WHEN 'location' THEN 'Miejsce / Lokacja'
    WHEN 'faction' THEN 'Frakcja / Organizacja'
    WHEN 'weather' THEN 'Pogoda i warunki'
    WHEN 'hook' THEN 'Haczyk przygody'
    WHEN 'loot_fantasy' THEN 'Lup / Znalezisko'
    WHEN 'clue' THEN 'Wskazowka sledcza'
    WHEN 'five_room_dungeon' THEN 'Loch 5-komnatowy'
    WHEN 'dungeon_advanced' THEN 'Generator lochu'
    WHEN 'event_quick' THEN 'Losowe wydarzenie'
    WHEN 'food_quick' THEN 'Posilek / Menu'
    WHEN 'shop_quick' THEN 'Sklep / Handel'
    WHEN 'story_hook_quick' THEN 'Plotka / Zlecenie'
    ELSE name
  END,
  updated_at = now()
WHERE code IN ('name','npc','location','faction','weather','hook','loot_fantasy','clue','five_room_dungeon','dungeon_advanced','event_quick','food_quick','shop_quick','story_hook_quick');

INSERT INTO generator_definitions (
    code, name, description, category, icon, category_code, type_code,
    genre_tags, system_tags, tone_tags, display_order, icon_key, is_active, created_at, updated_at
)
VALUES
    ('encounter_quick', 'Spotkanie', 'Szybkie spotkanie do wrzucenia w podrozy, miescie, lochu albo dziczy.', 'Narzedzia', 'swords', 'UTILITY', 'scene', '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb, '["system_agnostic"]'::jsonb, '["opisowy"]'::jsonb, 144, 'swords', true, now(), now()),
    ('complication_quick', 'Komplikacja sceny', 'Szybki twist lub utrudnienie do aktualnej sceny.', 'Narzedzia', 'spark', 'UTILITY', 'scene', '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb, '["system_agnostic"]'::jsonb, '["opisowy"]'::jsonb, 145, 'spark', true, now(), now()),
    ('document_quick', 'Dokument / Znalezisko', 'Listy, dzienniki, akty, raporty, mapy i inne dokumenty do sledztw, archiwow, biurek i bibliotek.', 'Narzedzia', 'scroll', 'UTILITY', 'clue', '["Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]'::jsonb, '["system_agnostic"]'::jsonb, '["opisowy"]'::jsonb, 146, 'scroll', true, now(), now())
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

WITH data(code, variant_name, variant_desc) AS (
    VALUES
        ('encounter_quick', 'Spotkanie szybkie', 'Spotkanie z miejscem, zagrozeniem, tonem i komplikacja.'),
        ('complication_quick', 'Komplikacja szybka', 'Twist sceny z natychmiastowym efektem i przyczyna.'),
        ('document_quick', 'Dokument szybki', 'Dokument, autor, fragment tresci i ukryte znaczenie.')
)
INSERT INTO generator_variants (
    generator_definition_id, variant_code, system_code, setting_code,
    category_code, tone_scope, mode, name, description, is_active
)
SELECT gd.id, 'general.quick', 'system_agnostic', 'multi', 'UTILITY', '["opisowy"]'::jsonb, 'quick', data.variant_name, data.variant_desc, true
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
  WHERE gv.variant_code IN ('general.quick', 'fantasy.quick', 'horror.quick')
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, field_key, label, type, options_json::jsonb, default_value, false, order_index
FROM variants
JOIN (
  VALUES
    ('location', 'locationPurpose', 'Funkcja sceny', 'SELECT', '["Losowa","Bezpieczne miejsce","Miejsce sledztwa","Miejsce walki","Miejsce rozmowy","Miejsce zasadzki","Miejsce odpoczynku","Miejsce handlu","Miejsce rytualu","Miejsce ukrycia","Miejsce finalu","Miejsce poscigu","Miejsce negocjacji","Miejsce odkrycia sekretu"]', 'Losowa', 30),
    ('hook', 'stakes', 'Stawka', 'SELECT', '["Losowa","Zycie jednej osoby","Los rodziny","Los osady","Sekret polityczny","Artefakt","Plaga","Znikniecia","Wojna frakcji","Dlug","Zemsta","Rytual","Katastrofa naturalna","Utrata reputacji","Zdrada sojusznika","Przetrwanie spolecznosci"]', 'Losowa', 30),
    ('hook', 'twistLevel', 'Poziom komplikacji', 'SELECT', '["Prosty","Z twistem","Moralnie niejednoznaczny","Mroczny"]', 'Z twistem', 40),
    ('loot_fantasy', 'rarity', 'Rzadkosc / wartosc', 'SELECT', '["Losowa","Banalny","Uzyteczny","Cenny","Dziwny","Przeklety","Fabularny"]', 'Losowa', 20),
    ('clue', 'reliability', 'Wiarygodnosc', 'SELECT', '["Losowa","Prawdziwa","Czesciowo prawdziwa","Zwodnicza","Falszywa, ale prowadzi do czegos waznego"]', 'Losowa', 30),
    ('shop_quick', 'shopMood', 'Klimat sklepu', 'SELECT', '["Losowy","Zwyczajny","Podejrzany","Ekskluzywny","Zaniedbany","Tajemniczy","Objazdowy","Nielegalny","Religijny","Wojskowy"]', 'Losowy', 20),
    ('shop_quick', 'includeProblem', 'Dodaj problem sklepu', 'CHECKBOX', '[]', 'true', 30),
    ('story_hook_quick', 'rumorReliability', 'Wiarygodnosc', 'SELECT', '["Losowa","Prawdziwa","Przesadzona","Falszywa","Czesciowo prawdziwa","Celowo rozsiana"]', 'Losowa', 20),
    ('story_hook_quick', 'rumorSource', 'Zrodlo', 'SELECT', '["Losowe","Karczma","Straz miejska","Dziecko","Kupiec","Kaplan","Szlachcic","Zebrak","Czarny rynek","List","Tablica ogloszen","Sen","Podsluchana rozmowa","Pijany swiadek","Uczen maga","Pracownik portu"]', 'Losowe', 30),
    ('encounter_quick', 'setting', 'Setting', 'SELECT', '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]', 'Losowy', 10),
    ('encounter_quick', 'place', 'Miejsce', 'SELECT', '["Losowe","Miasto","Droga","Las","Loch","Karczma","Morze","Ruiny","Gory","Bagna","Pustkowia","Port","Targ","Cmentarz","Kanaly"]', 'Losowe', 20),
    ('encounter_quick', 'dangerLevel', 'Poziom zagrozenia', 'SELECT', '["Niskie","Srednie","Wysokie","Niebojowe"]', 'Srednie', 30),
    ('encounter_quick', 'tone', 'Ton', 'SELECT', '["Losowy","Walka","Rozmowa","Tajemnica","Zasadzka","Problem moralny","Poscig","Handel","Ratunek"]', 'Losowy', 40),
    ('complication_quick', 'sceneType', 'Typ sceny', 'SELECT', '["Losowy","Walka","Rozmowa","Sledztwo","Podroz","Handel","Odpoczynek","Rytual","Poscig","Infiltracja"]', 'Losowy', 10),
    ('complication_quick', 'severity', 'Skala komplikacji', 'SELECT', '["Mala","Srednia","Duza"]', 'Srednia', 20),
    ('complication_quick', 'tone', 'Ton', 'SELECT', '["Losowy","Komediowa","Mroczna","Dramatyczna","Chaotyczna","Taktyczna","Spoleczna"]', 'Losowy', 30),
    ('document_quick', 'documentType', 'Typ dokumentu', 'SELECT', '["Losowy","List","Dziennik","Ksiega","Rachunek","Akt wlasnosci","Raport","Mapa","Telegram","Zeznanie","Kontrakt","Modlitwa","Recepta","Rozkaz","Nekrolog"]', 'Losowy', 10),
    ('document_quick', 'tone', 'Ton', 'SELECT', '["Losowy","Zwykly","Tajemniczy","Grozny","Urzedowy","Okultystyczny","Osobisty","Zaszyfrowany","Zniszczony"]', 'Losowy', 20),
    ('document_quick', 'setting', 'Setting', 'SELECT', '["Losowy","Fantasy","Horror","Sci-Fi","Postapo","Realistyczny"]', 'Losowy', 30)
) AS fields(code, field_key, label, type, options_json, default_value, order_index)
ON variants.code = fields.code
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

UPDATE generator_field_definitions gfd
SET options_json = (
  SELECT jsonb_agg(DISTINCT value)
  FROM jsonb_array_elements_text(gfd.options_json || '[
    "Grabarz","Celnik","Herold","Skryba","Kartograf","Byly najemnik","Lowca relikwii",
    "Lichwiarz","Treser zwierzat","Przewoznik","Latarnik","Straznik mostu","Poborca podatkowy",
    "Uczen maga","Falszywy kaplan","Cyrulik","Szuler","Kupiec relikwii","Archiwista","Patolog",
    "Reporter","Medium","Straznik cysterny","Mechanik osady","Handlarz lekami","Lowca zlomu",
    "Kurier","Radiooperator","Notariusz","Barman","Kierowca taksowki","Ksiegowy"
  ]'::jsonb) AS value
)
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'npc'
  AND gfd.field_key = 'role';

UPDATE generator_field_definitions gfd
SET options_json = (
  SELECT jsonb_agg(DISTINCT value)
  FROM jsonb_array_elements_text(gfd.options_json || '[
    "Wina","Zazdrosc","Dlug rodzinny","Zakazana wiedza","Ukryta choroba","Protekcja",
    "Falszywa tozsamosc","Przepowiednia","Stary kontrakt","Utracony majatek","Kradziez",
    "Chec awansu","Lek przed odkryciem","Ocalenie reputacji","Tajny opiekun","Zdradzona przysiega"
  ]'::jsonb) AS value
)
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'npc'
  AND gfd.field_key = 'motif';
