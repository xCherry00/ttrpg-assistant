UPDATE generator_definitions
SET is_active = false,
    updated_at = now()
WHERE category IN ('CORE', 'SYSTEM', 'GENERAL', 'UNIVERSAL');

WITH data(code, name, description, type_code, display_order, icon_key) AS (
  VALUES
    ('weather', 'Pogoda', 'Generuje temperaturę, zachmurzenie, opady, wiatr, widoczność i nastrój sceny.', 'environment', 10, 'cloud'),
    ('time_of_day', 'Pora dnia', 'Generuje porę dnia, światło, ruch, aktywność otoczenia i okazję lub utrudnienie.', 'environment', 20, 'clock'),
    ('scene_mood', 'Nastrój sceny', 'Generuje emocje, tempo, napięcie, dźwięki i sposób prowadzenia narracji.', 'mood', 30, 'spark'),
    ('background_event', 'Zdarzenie w tle', 'Generuje wydarzenie obok graczy, jego uczestników, wagę i możliwą eskalację.', 'event', 40, 'spark'),
    ('situational_complication', 'Komplikacja sytuacyjna', 'Generuje neutralny twist: co idzie nie tak, kto zyskuje i jak to obejść.', 'complication', 50, 'shuffle'),
    ('terrain_obstacle', 'Przeszkoda terenowa', 'Generuje neutralną przeszkodę, skalę, ryzyko, obejście i koszt czasowy.', 'obstacle', 60, 'mountain'),
    ('travel', 'Podróż', 'Generuje przebieg przemieszczania się: tempo, warunki, opóźnienia, postoje i zużycie zasobów.', 'travel', 70, 'map'),
    ('location_state', 'Stan lokacji', 'Generuje aktualny stan miasta, pokoju, statku, bazy, karczmy albo biura.', 'location', 80, 'castle'),
    ('crowd_activity', 'Aktywność tłumu', 'Generuje liczebność, zachowanie, kierunek ruchu, powód zgromadzenia i zapalnik.', 'event', 90, 'users'),
    ('random_sound', 'Losowy dźwięk', 'Generuje źródło dźwięku, odległość, regularność i możliwe wyjaśnienia.', 'sensory', 100, 'music'),
    ('random_smell', 'Losowy zapach', 'Generuje dominujący zapach, intensywność, źródło, trop i reakcję otoczenia.', 'sensory', 110, 'spark'),
    ('trace', 'Ślad', 'Generuje dowolny ślad po czymś: świeżość, widoczność, kierunek i mylący element.', 'clue', 120, 'search'),
    ('neutral_rumor', 'Plotka neutralna', 'Generuje niequestową plotkę tła świata, wiarygodność, źródło i możliwy haczyk.', 'rumor', 130, 'scroll'),
    ('social_mood', 'Nastrój społeczny', 'Generuje społeczny klimat miejsca, stosunek do obcych, strach, agresję i temat rozmów.', 'social', 140, 'shield'),
    ('local_rules', 'Lokalne zasady', 'Generuje oficjalną i niepisaną zasadę miejsca, strażnika normy, karę i wyjątki.', 'rule', 150, 'scroll'),
    ('name', 'Imiona', 'Generuje imiona, nazwiska albo pełne dane osobowe według kultury i płci.', 'name', 160, 'type')
)
INSERT INTO generator_definitions (
  code, name, description, category, icon,
  category_code, type_code, genre_tags, system_tags, tone_tags,
  display_order, icon_key, is_active
)
SELECT
  code, name, description, 'UNIVERSAL', icon_key,
  'UNIVERSAL', type_code, '["universal"]'::jsonb, '["system_agnostic","any"]'::jsonb, '["neutral"]'::jsonb,
  display_order, icon_key, true
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
    is_active = true,
    updated_at = now();

INSERT INTO generator_variants (
  generator_definition_id, variant_code, system_code, setting_code,
  category_code, tone_scope, mode, name, description, is_active
)
SELECT
  gd.id, 'general.quick', 'system_agnostic', 'none',
  'UNIVERSAL', '["neutral"]'::jsonb, 'quick', gd.name, gd.description, true
FROM generator_definitions gd
WHERE gd.category = 'UNIVERSAL' AND gd.is_active = true
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
  WHERE gd.category = 'UNIVERSAL' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'tone', 'Ton', 'SELECT', '["Losowy","Neutralny","Spokojny","Niepokojący","Ponury","Dynamiczny"]'::jsonb, 'Losowy', false, 10 FROM variants WHERE code <> 'name'
UNION ALL
SELECT id, 'intensity', 'Intensywność', 'SELECT', '["Losowa","Niska","Średnia","Wysoka"]'::jsonb, 'Losowa', false, 20 FROM variants WHERE code <> 'name'
UNION ALL
SELECT id, 'culture', 'Kultura', 'SELECT', '["Losowa","Słowiańska","Skandynawska","Germańska","Celtycka","Grecka","Łacińska / Rzymska","Arabska","Perska","Azjatycka ogólna","Japońska","Chińska","Koreańska","Indyjska","Afrykańska ogólna","Egipska","Turecka","Mongolska","Hiszpańska","Francuska","Angielska","Włoska","Custom"]'::jsonb, 'Losowa', false, 10 FROM variants WHERE code = 'name'
UNION ALL
SELECT id, 'gender', 'Płeć', 'SELECT', '["Losowa","Męska","Żeńska","Neutralna"]'::jsonb, 'Losowa', false, 20 FROM variants WHERE code = 'name'
UNION ALL
SELECT id, 'nameFormat', 'Format', 'SELECT', '["Imię + nazwisko","Tylko imię","Tylko nazwisko"]'::jsonb, 'Imię + nazwisko', false, 30 FROM variants WHERE code = 'name'
UNION ALL
SELECT id, 'count', 'Liczba wyników', 'NUMBER', '[]'::jsonb, '3', false, 40 FROM variants WHERE code = 'name'
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

INSERT INTO generator_pools (generator_type, system_code, subtype, payload_json)
VALUES
  ('weather', 'any', 'default', '{"temperatura":["chłodno","ciepło","duszno","mroźno","rześko"],"zachmurzenie":["ciężkie chmury","czyste niebo","niskie szare chmury","poszarpane obłoki"],"opady":["drobny deszcz","sucho","śnieg z deszczem","krótka ulewa"],"wiatr":["silny boczny wiatr","prawie bezwietrznie","zimne podmuchy","porywisty wiatr"],"widoczność":["ograniczona","dobra","poszarpana mgłą","zmienna"]}'::jsonb),
  ('time_of_day', 'any', 'default', '{"pora":["świt","wczesny poranek","południe","zmierzch","późna noc"],"światło":["blade","ostre","ciepłe","przygaszone"],"ruch":["prawie pusto","umiarkowany ruch","tłoczno","ruch zamiera"],"okazja":["dobre warunki do obserwacji","łatwo zniknąć w przejściach","otwierają się pierwsze usługi","straż zmienia wartę"],"utrudnienie":["mało świadków","większość miejsc jest zamknięta","hałas utrudnia rozmowę","zmęczenie daje o sobie znać"]}'::jsonb),
  ('scene_mood', 'any', 'default', '{"emocje":["napięcie","zmęczenie","podejrzliwość","oczekiwanie","ulga podszyta strachem"],"tempo":["powolne","nerwowe","urwane","ciężkie"],"dźwięki":["przyciszone rozmowy","odległe kroki","trzeszczenie drewna","nagła cisza"],"niepokój":["ktoś co chwilę ogląda się za siebie","światło wydaje się za słabe","nikt nie kończy zdań","powietrze jest ciężkie"]}'::jsonb),
  ('background_event', 'any', 'default', '{"zdarzenie":["ktoś się kłóci","ktoś ucieka","ktoś coś zgubił","pojawiają się interwenci","tłum zaczyna się zbierać"],"uczestnicy":["dwóch miejscowych","dziecko i strażnik","grupa podróżnych","obsługa miejsca"],"wciągnięcie":["gracze są tylko świadkami","ktoś prosi ich o pomoc","jedna osoba myli ich z uczestnikami"],"eskalacja":["spór może przejść w przemoc","ktoś zniknie w zamieszaniu","pojawi się fałszywe oskarżenie"]}'::jsonb),
  ('situational_complication', 'any', 'default', '{"problem":["droga zostaje zablokowana","ważna osoba spóźnia się","ktoś rozpoznaje złą osobę","potrzebny przedmiot znika"],"traci":["niewinny świadek","lokalny kupiec","sprzymierzeniec graczy","osoba próbująca zachować tajemnicę"],"zyskuje":["ktoś ukrywający prawdę","rywal","lokalna władza","przypadkowy oportunista"],"obejście":["obejście bokiem","negocjacje","odwrócenie uwagi","zapłacenie kosztu czasowego"]}'::jsonb),
  ('terrain_obstacle', 'any', 'default', '{"przeszkoda":["zawalona droga","śliska nawierzchnia","uszkodzony most","zalany korytarz","gęsta mgła","tłum blokujący przejście","awaria zasilania"],"skala":["mała","lokalna","duża","narastająca"],"ryzyko":["hałas","utrata czasu","obrażenia przy pośpiechu","zgubienie tropu"],"obejście":["dłuższa trasa","pomoc miejscowych","sprzęt albo narzędzia","cierpliwe oczekiwanie"]}'::jsonb),
  ('travel', 'any', 'default', '{"transport":["pieszo","wozem","konno","łodzią","pojazdem","transportem publicznym"],"tempo":["wolniej niż zakładano","sprawnie","z częstymi przerwami","nerwowo i szybko"],"warunki":["monotonne","męczące","niepewne","zaskakująco dobre"],"postój":["naprawa wyposażenia","krótki odpoczynek","kontrola na trasie","ominięcie przeszkody"],"koszt":["czas","paliwo lub zapasy","przysługa","pogorszenie morale"]}'::jsonb),
  ('location_state', 'any', 'default', '{"zatłoczenie":["pusto","umiarkowanie tłoczno","zatłoczone","dziwnie ciche mimo ludzi"],"porządek":["czysto","chaotycznie","zbyt sterylnie","pośpiesznie uprzątnięte"],"bezpieczeństwo":["ochrona obecna częściej niż zwykle","brak widocznej kontroli","patrole są nerwowe","wszyscy pilnują wejść"],"problem":["braki w usługach","napięcie między obecnymi","ukryta awaria","ktoś czegoś szuka"],"nietypowe":["nikt nie patrzy sobie w oczy","jedno miejsce jest omijane","zapach nie pasuje do lokacji","dźwięk dochodzi zza zamkniętych drzwi"]}'::jsonb),
  ('crowd_activity', 'any', 'default', '{"liczebność":["mała grupa","gęsty tłum","rozproszony tłum","fala ludzi"],"zachowanie":["idą jednym kierunkiem","szepczą między sobą","stoją bez jasnego powodu","szybko się denerwują"],"powód":["plotka","wezwanie władz","wypadek","publiczne upokorzenie","coś zauważonego w oddali"],"zapalnik":["głośna osoba","nagły huk","fałszywa informacja","czyjś upadek"],"ukrycie":["łatwo zgubić pościg","trudno iść pod prąd","można podsłuchać rozmowy","ktoś obserwuje z obrzeża"]}'::jsonb),
  ('random_sound', 'any', 'default', '{"źródło":["metaliczny stuk","kroki","krzyk w oddali","trzask drewna","kapanie wody","niski pomruk","gwizd wiatru","stłumiona rozmowa","nagła cisza"],"odległość":["blisko","za ścianą","daleko","nad głową","pod stopami"],"regularność":["pojedynczy","regularny","narastający","urywany"],"wyjaśnienie":["naturalne osiadanie budynku","ktoś pracuje w ukryciu","zwierzę albo mechanizm","celowe zwrócenie uwagi"],"fałsz":["wiatr","przypadkowy hałas","źle rozpoznany głos","echo"]}'::jsonb),
  ('random_smell', 'any', 'default', '{"zapach":["wilgoć","dym","pot","ozon","rdza","zgnilizna","perfumy","alkohol","spalony plastik","mokra odzież","stara żywność","środki dezynfekujące"],"intensywność":["ledwo wyczuwalny","wyraźny","drażniący","narastający"],"źródło":["niedawne zdarzenie","ukryte pomieszczenie","osoba w pobliżu","problem techniczny"],"trop":["prowadzi w bok","nie pasuje do miejsca","jest świeży","ktoś próbuje go zamaskować"]}'::jsonb),
  ('trace', 'any', 'default', '{"rodzaj":["odciski butów","ślady kół","zaschnięta ciecz","włókno ubrania","zadrapania","spalony fragment","ślad po przeciąganiu czegoś","brak kurzu w jednym miejscu"],"świeżość":["świeży","kilkugodzinny","stary","celowo odnowiony"],"widoczność":["łatwy do zauważenia","częściowo ukryty","widoczny tylko pod światło","prawie zatarty"],"sugeruje":["pośpiech","ciężar","walkę","ukryte przejście"],"myli":["kierunek","liczbę osób","czas zdarzenia","prawdziwe źródło"]}'::jsonb),
  ('neutral_rumor', 'any', 'default', '{"treść":["ceny transportu nagle wzrosły","ktoś widział obcych przy bramie","lokalna usługa działa krócej","ktoś wykupuje zapasy","ważna osoba przestała się pokazywać"],"wiarygodność":["niska","średnia","wysoka","trudna do oceny"],"źródło":["kupcy","obsługa","strażnicy","podróżni","dzieci"],"społeczeństwo":["ludzie są zmęczeni","wszyscy szukają winnego","nikt nie chce mówić głośno","temat dzieli mieszkańców"],"haczyk":["oficjalne wyjaśnienie jest zbyt proste","plotka prowadzi do realnego problemu","ktoś ją celowo podsyca","ktoś próbuje ją uciszyć"]}'::jsonb),
  ('social_mood', 'any', 'default', '{"nastrój":["zmęczeni i podejrzliwi","ostrożnie przyjaźni","wrodzy wobec obcych","milczący i przestraszeni","pobudzeni plotkami"],"obcy":["tolerowani","ignorowani","obserwowani","zatrzymywani pytaniami"],"władza":["budzi strach","jest lekceważona","działa nerwowo","wydaje się nieobecna"],"temat":["braki w zaopatrzeniu","ostatni wypadek","nadchodząca kontrola","plotka o zagrożeniu"],"zmiana":["konkretny dowód","pomoc publiczna","nieostrożne słowo","pokaz siły"]}'::jsonb),
  ('local_rules', 'any', 'default', '{"oficjalna":["każdy może wejść po okazaniu zgody","cisza obowiązuje po zmroku","handel tylko w wyznaczonym miejscu","broń musi pozostać schowana"],"niepisana":["obcy nie zadają pytań po zmroku","nie patrzy się w okna starszych domów","najpierw rozmawia się z pośrednikiem","nie wspomina się ostatniego incydentu"],"pilnuje":["straż","starszyzna","obsługa","lokalna grupa nacisku"],"kara":["wyrzucenie","grzywna","utrata dostępu","publiczne upokorzenie"],"omija":["bogaci","stali bywalcy","ludzie władzy","ci, którzy znają hasło"]}'::jsonb),
  ('name', 'any', 'default', '{"cultures":{"Słowiańska":{"male":["Mirosław","Borys","Lech","Witold"],"female":["Mira","Zofia","Lena","Dobrawa"],"neutral":["Sasza","Nika","Mika"],"family":["Kowal","Nowak","Wrona","Zaleski"]},"Skandynawska":{"male":["Erik","Sven","Leif","Bjorn"],"female":["Astrid","Freja","Ingrid","Sigrid"],"neutral":["Rune","Ari","Noor"],"family":["Haldorsen","Storm","Eklund","Vik"]},"Arabska":{"male":["Omar","Karim","Samir","Nadir"],"female":["Layla","Amira","Nadia","Zahra"],"neutral":["Nur","Iman","Safa"],"family":["al-Hadi","Mansur","Farouk","Rahman"]},"Japońska":{"male":["Haruto","Ren","Daichi","Kaito"],"female":["Aiko","Yuna","Hana","Mei"],"neutral":["Akira","Haru","Nao"],"family":["Sato","Tanaka","Kobayashi","Mori"]},"Angielska":{"male":["Arthur","Edwin","Henry","Thomas"],"female":["Evelyn","Martha","Clara","Iris"],"neutral":["Robin","Alex","Morgan"],"family":["Blackwood","Hill","Reed","Marsh"]}}}'::jsonb)
ON CONFLICT (generator_type, system_code, subtype) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
