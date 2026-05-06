INSERT INTO generator_definitions (code, name, description, category, icon, is_active)
VALUES
  ('encounter', 'Encounter', 'Generuje spotkania bojowe i fabularne do sesji.', 'SYSTEM', 'swords', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (generator_definition_id, variant_code, system_code, setting_code, mode, name, description, is_active)
SELECT gd.id, 'dnd.quick', 'dnd', 'fantasy', 'quick', 'Encounter D&D szybki', 'Spotkanie bojowe albo non-combat z budzetem XP, celem, twistem i elementem srodowiska.', true
FROM generator_definitions gd WHERE gd.code = 'encounter'
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
  WHERE gd.code = 'encounter' AND gv.variant_code = 'dnd.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'partyLevel', 'Poziom druzyny', 'NUMBER', '[]'::jsonb, '5', true, 10 FROM variant
UNION ALL
SELECT id, 'partySize', 'Liczba postaci', 'NUMBER', '[]'::jsonb, '4', true, 20 FROM variant
UNION ALL
SELECT id, 'difficulty', 'Trudnosc', 'SELECT', '["Easy","Medium","Hard","Deadly"]'::jsonb, 'Medium', true, 30 FROM variant
UNION ALL
SELECT id, 'encounterMode', 'Tryb encountera', 'SELECT', '["Combat","Non-combat"]'::jsonb, 'Combat', true, 40 FROM variant
UNION ALL
SELECT id, 'environment', 'Srodowisko', 'SELECT', '["Lochy","Las","Miasto","Ruiny","Gory","Bagna","Podziemia"]'::jsonb, 'Las', true, 50 FROM variant
UNION ALL
SELECT id, 'encounterType', 'Typ encountera', 'SELECT', '["Zasadzka","Patrol","Obrona miejsca","Rytual","Poscig","Negocjacje","Sledztwo","Przeszkoda"]'::jsonb, 'Zasadzka', true, 60 FROM variant
UNION ALL
SELECT id, 'includeTwist', 'Dodaj twist', 'CHECKBOX', '[]'::jsonb, 'true', false, 70 FROM variant
UNION ALL
SELECT id, 'includeEnvironmentFeature', 'Dodaj element srodowiska', 'CHECKBOX', '[]'::jsonb, 'true', false, 80 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

INSERT INTO generator_pools (generator_type, system_code, subtype, payload_json)
VALUES
  ('encounter', 'dnd', 'dnd.quick', $json$
  {
    "enemies": [
      {"name":"Goblin zwiadowca","cr":"1/4","xp":50,"environments":["Las","Ruiny","Podziemia","Lochy"],"role":"skirmisher"},
      {"name":"Wilk glodny krwi","cr":"1/4","xp":50,"environments":["Las","Gory"],"role":"brute"},
      {"name":"Bandzior z kusza","cr":"1/8","xp":25,"environments":["Miasto","Ruiny","Las"],"role":"ranged"},
      {"name":"Szkielet straznik","cr":"1/4","xp":50,"environments":["Ruiny","Podziemia","Lochy"],"role":"soldier"},
      {"name":"Ork rabus","cr":"1/2","xp":100,"environments":["Gory","Ruiny","Las"],"role":"brute"},
      {"name":"Kultysta akolita","cr":"1/4","xp":50,"environments":["Miasto","Ruiny","Lochy"],"role":"caster"},
      {"name":"Zwiadowca bandy","cr":"1/2","xp":100,"environments":["Las","Miasto","Gory"],"role":"ranged"},
      {"name":"Niedzwiedz jaskiniowy mlody","cr":"1","xp":200,"environments":["Las","Gory","Podziemia"],"role":"brute"},
      {"name":"Ghoul z katakumb","cr":"1","xp":200,"environments":["Podziemia","Lochy","Ruiny"],"role":"controller"},
      {"name":"Hobgoblin dowodca patrolu","cr":"1/2","xp":100,"environments":["Lochy","Ruiny","Gory"],"role":"leader"},
      {"name":"Ogr najemnik","cr":"2","xp":450,"environments":["Gory","Bagna","Ruiny"],"role":"elite"},
      {"name":"Ettercap lowca","cr":"2","xp":450,"environments":["Las","Bagna"],"role":"controller"},
      {"name":"Weteran strazy","cr":"3","xp":700,"environments":["Miasto","Ruiny","Lochy"],"role":"elite"},
      {"name":"Troll z mokradel","cr":"5","xp":1800,"environments":["Bagna","Gory"],"role":"solo"},
      {"name":"Maga renegata","cr":"6","xp":2300,"environments":["Miasto","Ruiny","Lochy"],"role":"caster"}
    ],
    "environmentFeatures": {
      "Lochy": ["waski most nad czarna studnia", "ruchome kraty dzielace pole walki", "wilgotne schody dajace przewage obroncom"],
      "Las": ["gesta mgla ograniczajaca widocznosc", "powalone drzewo tworzace naturalna barykade", "gniazdo os na skraju polany"],
      "Miasto": ["tlum cywilow blokujacy linie strzalu", "wozy i stragany jako oslony", "alarmujacy dzwon strazy miejskiej"],
      "Ruiny": ["niestabilna kolumna gotowa runac", "zapadnieta posadzka ukrywajaca piwnice", "stary magiczny krag wzmacniajacy zaklecia"],
      "Gory": ["osuwisko kamieni przy glosnych dzwiekach", "waske przejscie nad przepascia", "silny wiatr utrudniajacy strzaly"],
      "Bagna": ["grzaski teren spowalniajacy ruch", "trujace opary w niskich zaglebieniach", "ukryta woda po pas"],
      "Podziemia": ["krysztaly odbijajace swiatlo", "tunel o niskim sklepieniu", "cieply wyziew z pekniecia w skale"]
    },
    "objectives": [
      "przetrwac trzy rundy, zanim nadejdzie wsparcie",
      "przerwac rytual przed koncem sceny",
      "ochronic swiadka albo przewodnika",
      "odzyskac przedmiot i uciec bez dalszej walki",
      "przejac kontrolny punkt lokacji"
    ],
    "twists": [
      "jedna ze stron nie chce zabijac, tylko opoznic druzyne",
      "prawdziwy dowodca obserwuje starcie z ukrycia",
      "pokonany przeciwnik zna haslo do dalszej lokacji",
      "teren zaczyna sie zmieniac po pierwszej rundzie",
      "neutralny NPC moze przechylic szale konfliktu"
    ],
    "nonCombatConflicts": [
      "lokalni straznicy oskarzaja niewlasciwa osobe",
      "dwie frakcje probuja kupic milczenie tego samego swiadka",
      "przestraszony informator odmawia rozmowy bez gwarancji bezpieczenstwa",
      "rytual moze zostac przerwany tylko przez negocjacje z uczestnikami",
      "tlum blokuje droge, bo wierzy w falszywa plotke"
    ],
    "solutions": [
      "perswazja i ujawnienie dowodu",
      "skradanie oraz odciecie zrodla problemu",
      "przekupstwo albo wymiana przyslug",
      "pokaz sily bez rozlewu krwi",
      "test grupowy z jasna konsekwencja porazki"
    ],
    "failureConsequences": [
      "cel ucieka i zostawia falszywy trop",
      "relacje z lokalna frakcja pogarszaja sie",
      "druzyna traci czas i przeciwnicy wzmacniaja pozycje",
      "niewinny NPC ponosi koszt decyzji bohaterow",
      "powstaje publiczna plotka uderzajaca w reputacje druzyny"
    ],
    "skillChallenges": [
      "3 sukcesy przed 2 porazkami: Perswazja, Wglad, Historia",
      "4 sukcesy przed 3 porazkami: Skradanie, Percepcja, Zlodziejskie narzedzia",
      "3 sukcesy przed 2 porazkami: Atletyka, Akrobatyka, Survival",
      "4 sukcesy przed 2 porazkami: Religia, Arkana, Perswazja"
    ]
  }
  $json$::jsonb)
ON CONFLICT (generator_type, system_code, subtype) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
