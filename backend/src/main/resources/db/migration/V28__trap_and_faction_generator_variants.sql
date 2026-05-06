INSERT INTO generator_definitions (code, name, description, category, icon, is_active)
VALUES
  ('trap', 'Pułapka / hazard', 'Generuje pułapki, zagrożenia środowiskowe i proste puzzle.', 'SETTING', 'alert-triangle', true),
  ('faction', 'Frakcja / kult', 'Generuje organizacje, kulty, gangi, zakony i tajne stowarzyszenia.', 'SETTING', 'network', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    updated_at = now();

INSERT INTO generator_variants (generator_definition_id, variant_code, system_code, setting_code, mode, name, description, is_active)
SELECT gd.id, 'general.quick', 'any', 'fantasy', 'quick', 'Pułapka fantasy szybka', 'Mechaniczna, magiczna albo środowiskowa przeszkoda z wykryciem, rozbrojeniem i konsekwencją.', true
FROM generator_definitions gd WHERE gd.code = 'trap'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code, mode = EXCLUDED.mode,
    name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO generator_variants (generator_definition_id, variant_code, system_code, setting_code, mode, name, description, is_active)
SELECT gd.id, 'general.quick', 'any', 'fantasy', 'quick', 'Frakcja fantasy szybka', 'Nazwa, symbol, cel, lider, zasoby, sekret i relacje frakcji.', true
FROM generator_definitions gd WHERE gd.code = 'faction'
ON CONFLICT (generator_definition_id, variant_code) DO UPDATE
SET system_code = EXCLUDED.system_code, setting_code = EXCLUDED.setting_code, mode = EXCLUDED.mode,
    name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

WITH variant AS (
  SELECT gv.id FROM generator_variants gv JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'trap' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'trapType', 'Typ pułapki', 'SELECT', '["Losowa","Mechaniczna","Magiczna","Środowiskowa","Puzzle"]'::jsonb, 'Losowa', false, 10 FROM variant
UNION ALL
SELECT id, 'danger', 'Poziom zagrożenia', 'SELECT', '["Niskie","Średnie","Wysokie"]'::jsonb, 'Średnie', false, 20 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

WITH variant AS (
  SELECT gv.id FROM generator_variants gv JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'faction' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'factionType', 'Typ frakcji', 'SELECT', '["Losowy","Gildia","Kult","Zakon","Gang","Tajne stowarzyszenie","Kompania handlowa"]'::jsonb, 'Losowy', false, 10 FROM variant
UNION ALL
SELECT id, 'scale', 'Skala', 'SELECT', '["Lokalna","Regionalna","Ukryta","Wpływowa"]'::jsonb, 'Lokalna', false, 20 FROM variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label, type = EXCLUDED.type, options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value, required = EXCLUDED.required, order_index = EXCLUDED.order_index;

INSERT INTO generator_pools (generator_type, system_code, subtype, payload_json)
VALUES
  ('trap', 'any', 'general.quick', $json$
  {
    "types": ["Mechaniczna","Magiczna","Środowiskowa","Puzzle"],
    "names": ["Szept Ostrzy","Schody Głodnego Kamienia","Pieczęć Zimnego Oddechu","Studnia Fałszywego Echa","Zegar Czarnego Piasku"],
    "triggers": [
      "naciśnięcie trzeciej płyty od wejścia",
      "otwarcie skrzyni bez wypowiedzenia hasła",
      "przerwanie linii kredowego symbolu",
      "zabranie przedmiotu z cokołu",
      "rzucenie cienia na srebrny znak"
    ],
    "detections": [
      "delikatne rysy na podłodze układają się w wachlarz",
      "w powietrzu czuć metaliczny zapach",
      "kurz nie osiada na jednej części posadzki",
      "jedna ściana odbija dźwięk z opóźnieniem",
      "na krawędzi mechanizmu widać świeży tłuszcz"
    ],
    "effects": [
      "ostrza wysuwają się z dwóch stron korytarza",
      "z sufitu opada zimna mgła usypiająca czujność",
      "podłoga przechyla się w stronę ukrytego szybu",
      "magiczny impuls przyciąga metalowe przedmioty do ściany",
      "pomieszczenie zamyka się i zaczyna powoli wypełniać wodą"
    ],
    "disarms": [
      "zablokować przeciwwagę cienkim klinem",
      "odtworzyć brakujący fragment symbolu",
      "przytrzymać dźwignię przez trzy oddechy",
      "wyjąć fałszywy pin i obrócić pierścień mechanizmu",
      "odwrócić uwagę zaklęcia krótkim źródłem światła"
    ],
    "consequences": [
      "hałas alarmuje pobliskich strażników",
      "pułapka niszczy część łupu",
      "ofiara zostaje rozdzielona od reszty grupy",
      "na bohaterach zostaje widoczny magiczny znak",
      "droga powrotna staje się trudniejsza"
    ]
  }
  $json$::jsonb),
  ('faction', 'any', 'general.quick', $json$
  {
    "types": ["Gildia","Kult","Zakon","Gang","Tajne stowarzyszenie","Kompania handlowa"],
    "adjectives": ["Srebrnej","Czarnej","Milczącej","Złamanej","Bursztynowej","Szkarłatnej","Żelaznej"],
    "nouns": ["Pieczęci","LatarnI","Dłoni","Korony","Maski","Przysięgi","Księgi"],
    "symbols": [
      "oko wpisane w monetę",
      "pęknięta korona na czarnym tle",
      "trzy dłonie trzymające jedną świecę",
      "biały klucz owinięty cierniem",
      "maska bez ust"
    ],
    "goals": [
      "kontrolować przepływ informacji w mieście",
      "odnaleźć relikt sprzed upadku królestwa",
      "obalić lokalnego możnego bez otwartej wojny",
      "przebudzić albo powstrzymać zapomniany rytuał",
      "zmonopolizować handel rzadkim surowcem"
    ],
    "leaders": [
      "uprzejma wdowa z siecią dłużników",
      "były kapłan, który nigdy nie zdejmuje rękawic",
      "kupiec znany z hojności i okrutnej pamięci",
      "młoda strateg ukryta za radą starszych",
      "człowiek, którego nikt nie widział dwa razy z tą samą twarzą"
    ],
    "resources": [
      "informatorzy w karczmach i świątyniach",
      "mały oddział świetnie opłaconych ochroniarzy",
      "archiwum kompromitujących listów",
      "sekretne przejścia pod dzielnicą kupiecką",
      "magazyny, legalne przykrywki i długi wdzięczności"
    ],
    "secrets": [
      "frakcja jest podzielona i bliska wewnętrznej wojny",
      "lider jest marionetką kogoś spoza miasta",
      "ich symbol pojawia się przy dawnych miejscach zbrodni",
      "największy wróg frakcji finansuje ją przez pośredników",
      "ich prawdziwy cel jest odwrotny do publicznych deklaracji"
    ],
    "relations": [
      "otwarcie wspiera straż miejską, ale przekupuje jej rywali",
      "toczy cichą wojnę z lokalnym kultem",
      "utrzymuje kruchy sojusz z kupcami",
      "szuka najemników, którym da się zaprzeczyć",
      "ma dług wobec osoby z otoczenia drużyny"
    ]
  }
  $json$::jsonb)
ON CONFLICT (generator_type, system_code, subtype) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
