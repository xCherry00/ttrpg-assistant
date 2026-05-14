-- Expand visible MVP option pools and restore Polish labels in forms/catalog.

UPDATE generator_definitions
SET name = 'Łup',
    description = 'Szybki łup: monety, główny przedmiot, dziwny detal i sekret.',
    updated_at = now()
WHERE code = 'loot_fantasy';

UPDATE generator_definitions
SET name = 'Wskazówka',
    description = 'Dowód albo ślad do sceny: opis, znaczenie i zwodniczy detal.',
    updated_at = now()
WHERE code = 'clue';

UPDATE generator_variants gv
SET name = 'Łup',
    description = 'Monety, główny przedmiot, dziwny detal i sekret.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'loot_fantasy';

UPDATE generator_variants gv
SET name = 'Wskazówka',
    description = 'Dowód albo ślad do sceny: opis, znaczenie i zwodniczy detal.'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'clue';

UPDATE generator_field_definitions gfd
SET options_json = '["Losowa","Kupiec","Strażnik","Uczony","Kapłan","Przestępca","Szlachcic","Rzemieślnik","Podróżnik","Najemnik","Zwiadowca","Alchemik","Bard","Sędzia","Herold","Śledczy","Świadek","Podejrzany","Lekarz","Bibliotekarz","Okultysta","Dziennikarz","Ksiądz","Dozorca","Fotograf","Patolog","Mechanik","Pilot","Medyk","Analityk","Przemytnik","Oficer stacji","Haker","Dyplomata","Inżynier napędu","Kurier orbitalny","Ocalały","Lider osady","Szabrownik","Łowca zasobów","Strażnik bramy","Handlarz wodą","Kaznodzieja","Urzędnik","Nauczyciel","Ochroniarz","Recepcjonistka","Technik"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'npc'
  AND gfd.field_key = 'role';

UPDATE generator_field_definitions gfd
SET options_json = '["Losowy","Tawerna","Sklep","Osada","Dzielnica","Świątynia","Biblioteka","Port","Las","Ruiny","Zamek","Wieża maga","Cmentarz","Most","Kopalnia","Młyn","Sąd","Miejsce śledztwa","Archiwum","Szpital","Motel","Stary dom","Kostnica","Szkoła","Sanatorium","Statek kosmiczny","Stacja kosmiczna","Kolonia","Planeta","Laboratorium","Port orbitalny","Wrak","Kopuła mieszkalna","Kopalnia asteroid","Archiwum danych","Schronienie","Ruiny miejskie","Bunkier","Farma","Fabryka","Posterunek","Targ złomu","Wieża radiowa","Stacja benzynowa","Tunel metra","Mieszkanie","Biuro","Bar","Magazyn","Dworzec","Hotel","Parking","Kawiarnia","Komisariat","Warsztat"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'location'
  AND gfd.field_key = 'locationType';

UPDATE generator_field_definitions gfd
SET options_json = '["Losowy","Gildia","Zakon","Rada miejska","Kult","Kompania najemna","Cech","Bractwo","Ród","Krąg magów","Straż świątynna","Liga kupiecka","Tajna loża","Towarzystwo okultystyczne","Fundacja","Krąg badaczy","Rodzina wpływów","Komitet parafialny","Sanatorium","Klub kolekcjonerów","Korporacja","Załoga","Agencja","Kartel","Konsorcjum","Ruch oporu","Klan orbitalny","Syndykat danych","Flota najemna","Osada","Banda","Karawana","Milicja","Klan","Syndykat zasobów","Radio-wspólnota","Zakon wody","Mechanicy","Stowarzyszenie","Firma","Komitet","Ruch społeczny","Sieć kontaktów","Spółdzielnia"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'faction'
  AND gfd.field_key = 'factionType';

UPDATE generator_field_definitions gfd
SET options_json = '["Losowy","Ślad fizyczny","Dokument","Relacja świadka","Nagranie","Symbol","Brakujący element","Mapa","Log systemowy","Rzecz osobista","Niepasujący zapach","Uszkodzony nośnik","Znak ostrzegawczy","Znak magiczny","Plotka","Relikwia","Herb","Przysięga","Pieczęć","Fotografia","Próbka","List","Dane biometryczne","Brakujący plik","Fałszywy identyfikator","Sygnał","Czarna skrzynka","Ślad w terenie","Porzucony przedmiot","Świeże ognisko","Łuska","Filtr","Opaska","Monitoring","Zeznanie","Paragon","Telefon","Klucz","Notatka"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'clue'
  AND gfd.field_key = 'clueType';

UPDATE generator_field_definitions gfd
SET label = 'Typ łupu',
    options_json = '["Losowy","Monety","Przedmiot","Dokument","Relikwia","Ekwipunek","Osobliwość","Klejnoty","Mapa","Klucz","Księga","Pamiątka","Składnik magiczny","Zastaw","Dowód"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'loot_fantasy'
  AND gfd.field_key = 'lootType';

UPDATE generator_pools
SET payload_json = jsonb_set(
  payload_json::jsonb,
  '{cultures}',
  (payload_json::jsonb -> 'cultures') || '{
    "Germańska":{"male":["Adalbert","Konrad","Ulrich","Friedrich"],"female":["Hilda","Greta","Lisel","Anke"],"neutral":["Sascha","Rene"],"family":["Vogel","Kramer","Weiss","Hartmann"]},
    "Celtycka":{"male":["Aidan","Bran","Cormac","Ewan"],"female":["Maeve","Nia","Brigid","Riona"],"neutral":["Rowan","Ainsley"],"family":["OBrien","MacNair","Kellan","Doyle"]},
    "Grecka":{"male":["Damon","Nikos","Leander","Timon"],"female":["Ione","Daphne","Helena","Kora"],"neutral":["Alexis","Dorian"],"family":["Pappas","Kallis","Nerios","Theon"]},
    "Perska":{"male":["Darius","Farid","Rostam","Bahram"],"female":["Shirin","Laleh","Parisa","Roxana"],"neutral":["Azar","Noor"],"family":["Darvish","Nazari","Farrokh","Mehr"]},
    "Egipska":{"male":["Anen","Khaem","Mose","Hori"],"female":["Nefra","Tia","Merit","Satra"],"neutral":["Amunet","Seba"],"family":["Menka","Hotep","Saqqar","Nebu"]},
    "Hiszpańska":{"male":["Diego","Mateo","Santiago","Rafael"],"female":["Isabel","Lucia","Marina","Carmen"],"neutral":["Cruz","Sol"],"family":["Vega","Torres","Navarro","Castillo"]},
    "Francuska":{"male":["Etienne","Luc","Gaston","Marcel"],"female":["Claire","Elise","Manon","Adele"],"neutral":["Camille","Claude"],"family":["Moreau","Lefevre","Roux","Dumont"]},
    "Włoska":{"male":["Lorenzo","Marco","Silvio","Dante"],"female":["Giulia","Bianca","Viola","Lucia"],"neutral":["Andrea","Ren"],"family":["Conti","Rossi","Ferraro","Bianchi"]},
    "Chińska":{"male":["Wei","Jian","Long","Chen"],"female":["Mei","Lian","Xiu","Yan"],"neutral":["An","Min"],"family":["Li","Zhang","Wang","Chen"]},
    "Koreańska":{"male":["Min-jun","Seo-jin","Ji-ho","Hyun"],"female":["Ji-woo","Ha-eun","Soo-ah","Yuna"],"neutral":["Jae","Min"],"family":["Kim","Park","Lee","Choi"]},
    "Indyjska":{"male":["Arjun","Ravi","Dev","Vikram"],"female":["Anika","Mira","Priya","Leela"],"neutral":["Kiran","Shaan"],"family":["Rao","Kapoor","Mehta","Iyer"]},
    "Turecka":{"male":["Emir","Kerem","Orhan","Selim"],"female":["Aylin","Elif","Leyla","Seda"],"neutral":["Deniz","Eren"],"family":["Yilmaz","Demir","Kaya","Arslan"]}
  }'::jsonb,
  true
)
WHERE generator_type = 'name'
  AND system_code = 'any'
  AND subtype = 'default';
