-- V23__seed_first_generators_and_rules_catalog.sql
-- Seed-first generator architecture: seed data and deterministic algorithms only.

ALTER TABLE generator_pools
  ADD COLUMN IF NOT EXISTS subtype VARCHAR(48) NOT NULL DEFAULT 'default';

ALTER TABLE generator_pools
  DROP CONSTRAINT IF EXISTS ux_generator_pool_type_system;

CREATE UNIQUE INDEX IF NOT EXISTS ux_generator_pool_type_system_subtype
  ON generator_pools(generator_type, system_code, subtype);

ALTER TABLE rules_pages
  ADD COLUMN IF NOT EXISTS category VARCHAR(64) NOT NULL DEFAULT 'reference',
  ADD COLUMN IF NOT EXISTS summary VARCHAR(280),
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS quick_ref BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS source_label VARCHAR(120);

ALTER TABLE monsters
  ADD COLUMN IF NOT EXISTS system_code VARCHAR(32) NOT NULL DEFAULT 'dnd',
  ADD COLUMN IF NOT EXISTS challenge_rating NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS xp INT,
  ADD COLUMN IF NOT EXISTS monster_type VARCHAR(64),
  ADD COLUMN IF NOT EXISTS environment VARCHAR(120),
  ADD COLUMN IF NOT EXISTS statblock_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_label VARCHAR(120);

UPDATE rules_pages
SET category = CASE
    WHEN slug ILIKE '%combat%' OR slug ILIKE '%initiative%' THEN 'combat'
    WHEN slug ILIKE '%spell%' OR slug ILIKE '%magic%' THEN 'magic'
    WHEN slug ILIKE '%sanity%' OR slug ILIKE '%fear%' THEN 'horror'
    WHEN slug ILIKE '%basic%' OR slug ILIKE '%basics%' THEN 'basics'
    ELSE 'reference'
  END,
  summary = COALESCE(summary, left(regexp_replace(content, E'\\\\n|\\n', ' ', 'g'), 240)),
  quick_ref = slug IN ('basics', 'basic-rules', 'combat', 'initiative', 'sanity', 'spells'),
  sort_order = CASE
    WHEN slug IN ('basics', 'basic-rules') THEN 10
    WHEN slug IN ('combat', 'initiative') THEN 20
    WHEN slug IN ('spells', 'magic') THEN 30
    ELSE 100
  END,
  source_label = COALESCE(source_label, 'Internal quick reference');

UPDATE monsters
SET challenge_rating = CASE name_en
    WHEN 'Goblin' THEN 0.25 WHEN 'Orc' THEN 0.50 WHEN 'Hobgoblin' THEN 0.50
    WHEN 'Kobold' THEN 0.13 WHEN 'Bandit' THEN 0.13 WHEN 'Cultist' THEN 0.13
    WHEN 'Wolf' THEN 0.25 WHEN 'Bear' THEN 1.00 WHEN 'Giant Spider' THEN 1.00
    WHEN 'Giant Rat' THEN 0.13 WHEN 'Skeleton' THEN 0.25 WHEN 'Zombie' THEN 0.25
    WHEN 'Ghoul' THEN 1.00 WHEN 'Wraith' THEN 5.00 WHEN 'Ogre' THEN 2.00
    WHEN 'Troll' THEN 5.00 WHEN 'Minotaur' THEN 3.00 WHEN 'Manticore' THEN 3.00
    WHEN 'Clay Golem' THEN 9.00 WHEN 'Animated Armor' THEN 1.00 WHEN 'Imp' THEN 1.00
    WHEN 'Quasit' THEN 1.00 WHEN 'Red Dragon Wyrmling' THEN 4.00 WHEN 'Drake' THEN 2.00
    WHEN 'Treant' THEN 9.00 WHEN 'Gargoyle' THEN 2.00 WHEN 'Harpy' THEN 1.00
    WHEN 'Medusa' THEN 6.00 WHEN 'Kraken Spawn' THEN 5.00
    ELSE challenge_rating
  END,
  xp = CASE name_en
    WHEN 'Goblin' THEN 50 WHEN 'Orc' THEN 100 WHEN 'Hobgoblin' THEN 100
    WHEN 'Kobold' THEN 25 WHEN 'Bandit' THEN 25 WHEN 'Cultist' THEN 25
    WHEN 'Wolf' THEN 50 WHEN 'Bear' THEN 200 WHEN 'Giant Spider' THEN 200
    WHEN 'Giant Rat' THEN 25 WHEN 'Skeleton' THEN 50 WHEN 'Zombie' THEN 50
    WHEN 'Ghoul' THEN 200 WHEN 'Wraith' THEN 1800 WHEN 'Ogre' THEN 450
    WHEN 'Troll' THEN 1800 WHEN 'Minotaur' THEN 700 WHEN 'Manticore' THEN 700
    WHEN 'Clay Golem' THEN 5000 WHEN 'Animated Armor' THEN 200 WHEN 'Imp' THEN 200
    WHEN 'Quasit' THEN 200 WHEN 'Red Dragon Wyrmling' THEN 1100 WHEN 'Drake' THEN 450
    WHEN 'Treant' THEN 5000 WHEN 'Gargoyle' THEN 450 WHEN 'Harpy' THEN 200
    WHEN 'Medusa' THEN 2300 WHEN 'Kraken Spawn' THEN 1800
    ELSE xp
  END,
  monster_type = CASE
    WHEN name_en IN ('Goblin','Orc','Hobgoblin','Kobold','Bandit','Cultist') THEN 'Humanoid'
    WHEN name_en IN ('Wolf','Bear','Giant Spider','Giant Rat') THEN 'Beast'
    WHEN name_en IN ('Skeleton','Zombie','Ghoul','Wraith') THEN 'Undead'
    WHEN name_en IN ('Clay Golem','Animated Armor') THEN 'Construct'
    WHEN name_en IN ('Imp','Quasit') THEN 'Fiend'
    WHEN name_en IN ('Red Dragon Wyrmling','Drake') THEN 'Dragon'
    ELSE 'Monstrosity'
  END,
  environment = CASE
    WHEN name_en IN ('Goblin','Kobold','Giant Spider','Skeleton','Zombie','Ghoul') THEN 'Lochy, ruiny'
    WHEN name_en IN ('Wolf','Bear','Troll','Treant','Harpy') THEN 'Las, dzicz'
    WHEN name_en IN ('Bandit','Cultist','Animated Armor') THEN 'Miasto, twierdza'
    ELSE 'Dowolne'
  END,
  source_label = COALESCE(source_label, 'Internal SRD-style seed');

INSERT INTO generator_pools (generator_type, system_code, subtype, payload_json)
VALUES
  ('name', 'any', 'default', $json$
  {
    "cultures": {
      "Słowiańska": {
        "given": ["Mira","Dobromir","Zora","Radek","Milena","Borys","Lada","Witold"],
        "family": ["Wilczyńska","Dębowski","Czarnybrzeg","Lisowa","Żelazny","Ruczaj"]
      },
      "Nordycka": {
        "given": ["Astrid","Bjorn","Sigrid","Eirik","Freya","Leif","Runa","Sten"],
        "family": ["Stormsen","Ironhand","Frostbeard","Ravenmark","Skaldsdottir","Northwake"]
      },
      "Fantastyczna": {
        "given": ["Aelar","Nyx","Kaelen","Seraphine","Thamior","Ilyra","Veyra","Corvin"],
        "family": ["Moonveil","Ashthorne","Starfall","Duskwick","Emberlane","Silverrook"]
      }
    }
  }
  $json$::jsonb),
  ('twist', 'any', 'default', $json$
  {
    "entries": [
      {"scene":"Walka","intensity":"Średni","result":"Do starcia dołącza trzecia strona z własnym celem."},
      {"scene":"Negocjacje","intensity":"Lekki","result":"Rozmówca rozpoznaje jednego z bohaterów z przeszłości."},
      {"scene":"Śledztwo","intensity":"Ciężki","result":"Najbardziej oczywisty świadek sam sfabrykował część dowodów."},
      {"scene":"Podróż","intensity":"Średni","result":"Trasa jest celowo oznaczona fałszywymi znakami."}
    ]
  }
  $json$::jsonb),
  ('hook', 'any', 'default', $json$
  {
    "entries": [
      {"mood":"Tajemnica","scale":"Lokalna","situation":"Karczmarz prosi drużynę o dyskrecję.","detail":"Ktoś każdej nocy zostawia mokre ślady prowadzące do zamkniętej studni.","lead":"Studnia, dawny grabarz i księga gości."},
      {"mood":"Przygodowy","scale":"Regionalna","situation":"Kupiecka karawana szuka eskorty.","detail":"Poprzednia eskorta wróciła bez pamięci ostatnich dwóch dni.","lead":"Mapa trasy, ocalały muł i dziwny srebrny pył."},
      {"mood":"Horror","scale":"Lokalna","situation":"Dzwon świątynny bije sam o świcie.","detail":"Od trzech dni nikt nie widział kapłana.","lead":"Wieża, zakrystia i stary cmentarz."}
    ]
  }
  $json$::jsonb),
  ('complication', 'any', 'default', $json$
  {
    "entries": [
      "Ktoś nieoczekiwanie dołącza do sceny i zna niewygodny sekret.",
      "Pogoda gwałtownie się załamuje, utrudniając widoczność i ruch.",
      "Wiadomość wymaga natychmiastowej decyzji, zanim scena się skończy.",
      "Niewinny świadek widzi coś, czego nie powinien widzieć."
    ]
  }
  $json$::jsonb),
  ('weather', 'any', 'default', $json$
  {
    "entries": [
      {"climate":"Umiarkowany","season":"Jesień","mood":"Złowieszczy","description":"Ciężkie chmury wiszą nisko, a wiatr niesie zapach mokrych liści i dymu.","effect":"Tropy są trudniejsze do odczytania."},
      {"climate":"Górski","season":"Zima","mood":"Dramatyczny","description":"Śnieg tnie skórę drobnymi igłami, a echo kroków ginie w bieli.","effect":"Dłuższa podróż wymaga testu wytrzymałości."},
      {"climate":"Tropikalny","season":"Lato","mood":"Spokojny","description":"Ciepły deszcz pada równo, tłumiąc hałas i zostawiając słodki zapach kwiatów.","effect":"Skradanie jest łatwiejsze wśród deszczu."}
    ]
  }
  $json$::jsonb),
  ('scvm', 'morkborg', 'default', $json$
  {
    "names": ["Sverd the Unwashed","Nail of Grift","Sister Rot","Varn Ashmouth","Mire the Bent"],
    "classes": ["Classless","Gutterborn Scum","Fanged Deserter","Heretical Priest","Occult Herbmaster"],
    "gear": ["Maczuga d6","Zardzewiały nóż d4","Latarnia i olej","Skórzana zbroja -d2","Szczury w klatce","Lina 30 stóp","Srebrny ząb"],
    "curses": ["Tatuaż boga, którego nikt nie zna.","Cień porusza się chwilę później.","Śmiech brzmi jak płacz dziecka.","Nie możesz spać pod dachem."]
  }
  $json$::jsonb),
  ('encounter', 'pf2e', 'default', $json$
  {
    "creatures": [
      {"name":"Goblin Warrior","level":-1,"environment":"Las, ruiny"},
      {"name":"Skeleton Guard","level":-1,"environment":"Krypta"},
      {"name":"Wolf","level":1,"environment":"Las"},
      {"name":"Ogre Warrior","level":3,"environment":"Wzgórza"},
      {"name":"Cult Adept","level":4,"environment":"Miasto, świątynia"}
    ]
  }
  $json$::jsonb)
ON CONFLICT (generator_type, system_code, subtype) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
