-- V5__seed_more_glossary_and_rules.sql
-- Rozszerzenie slowniczka i zasad o kolejne systemy

-- =========================
-- GLOSSARY SEED (MORE TERMS)
-- =========================
INSERT INTO glossary_terms (term_pl, term_en, definition, category, system, tags)
VALUES
  ('One-shot', 'One-shot',
   'Samodzielna, zwykle krotka przygoda zamknieta w jednej sesji albo dwoch spotkaniach.',
   'narracja', 'uniwersalne', 'oneshot,przygoda'),

  ('Session Zero', 'Session Zero',
   'Spotkanie organizacyjne przed kampania, podczas ktorego ustala sie klimat gry, granice i zasady wspolpracy.',
   'meta', 'uniwersalne', 'sessionzero,ustalenia'),

  ('Railroading', 'Railroading',
   'Prowadzenie fabuly tak, aby gracze mieli bardzo malo realnych decyzji i musieli isc jednym torem.',
   'meta', 'uniwersalne', 'railroading,fabula'),

  ('Sandbox', 'Sandbox',
   'Styl gry, w ktorym swiat reaguje na decyzje graczy, a fabula rozwija sie glownie przez ich wybory.',
   'narracja', 'uniwersalne', 'sandbox,otwarty-swiat'),

  ('Hook fabularny', 'Story Hook',
   'Element fabuly, ktory ma zainteresowac druzyne i popchnac akcje do przodu.',
   'narracja', 'uniwersalne', 'hook,fabula'),

  ('Test przeciwstawny', 'Opposed Test',
   'Sytuacja, w ktorej dwie strony rzucaja, a lepszy wynik lub wiekszy poziom sukcesu wygrywa.',
   'mechanika', 'uniwersalne', 'test,przeciwstawny'),

  ('Advantage / Disadvantage', 'Advantage / Disadvantage',
   'Modyfikacja rzutu polegajaca na rzuceniu dwa razy i wybraniu lepszego albo gorszego wyniku, zalezne od sytuacji.',
   'mechanika', 'uniwersalne', 'advantage,disadvantage'),

  ('Save', 'Saving Throw',
   'Rzut obronny wykonywany, by uniknac lub ograniczyc negatywny efekt, np. zaklecia albo pulapki.',
   'mechanika', 'uniwersalne', 'save,obrona'),

  ('Condition', 'Status Condition',
   'Stan postaci, ktory czasowo zmienia jej mozliwosci, np. oslupienie, zatrucie albo przewrocenie.',
   'walka', 'uniwersalne', 'status,condition'),

  ('Crowd Control', 'Crowd Control',
   'Zdolnosci, ktore ograniczaja ruch lub akcje przeciwnikow zamiast zadawac czyste obrazenia.',
   'walka', 'uniwersalne', 'cc,walka'),

  ('Tempo sceny', 'Scene Pacing',
   'Rytm prowadzenia sceny: kiedy przyspieszyc wydarzenia, a kiedy dac miejsce na roleplay i decyzje.',
   'narracja', 'uniwersalne', 'tempo,pacing'),

  ('Retcon', 'Retcon',
   'Swiadoma korekta wczesniejszego elementu fabuly, aby utrzymac spojnosc albo naprawic blad.',
   'meta', 'uniwersalne', 'retcon,ciaglosc'),

  ('Fail Forward', 'Fail Forward',
   'Podejscie, w ktorym porazka rzutu nie zatrzymuje historii, tylko wprowadza koszt albo komplikacje.',
   'meta', 'uniwersalne', 'fail-forward,komplikacje'),

  ('Front', 'Adventure Front',
   'Pakiet zagrozen i wydarzen, ktore rozwijaja sie w tle, jesli druzyna ich nie zatrzyma.',
   'narracja', 'uniwersalne', 'front,zagrozenia'),

  ('Spotkanie towarzyskie', 'Social Encounter',
   'Scena negocjacji, przesluchania albo dyplomacji, gdzie kluczowe sa argumenty i relacje.',
   'narracja', 'uniwersalne', 'social,interakcja'),

  ('Encounter', 'Encounter',
   'Pojedyncze wyzwanie dla druzyny: walka, przeszkoda terenowa, zagadka lub scena spoleczna.',
   'mechanika', 'uniwersalne', 'encounter,wyzwanie'),

  ('Ekwipunek podróżny', 'Adventuring Gear',
   'Podstawowe przedmioty używane między walkami: liny, racje, pochodnie, narzędzia i zapasy.',
   'mechanika', 'uniwersalne', 'ekwipunek,podroz'),

  ('Tło postaci', 'Character Background',
   'Pakiet historii i motywacji postaci, ktory podpowiada jak odgrywac jej decyzje.',
   'postacie', 'uniwersalne', 'background,postac'),

  ('Archetyp', 'Archetype',
   'Wyrazny wzorzec roli postaci, np. obronca, zwiadowca, mistyk lub wsparcie.',
   'postacie', 'uniwersalne', 'archetyp,rola'),

  ('Downtime', 'Downtime',
   'Czas pomiedzy wyprawami przeznaczony na trening, handel, leczenie i rozwijanie watkow pobocznych.',
   'narracja', 'uniwersalne', 'downtime,miedzy-sesjami')
ON CONFLICT (term_pl, system) DO NOTHING;

-- =========================
-- RULES PAGES SEED (NEW SYSTEMS)
-- =========================
INSERT INTO rules_pages(system_code, slug, title, content)
VALUES
  -- Warhammer Fantasy Roleplay 4e
  ('wh4e', 'core-loop', 'Warhammer 4ed: rdzen gry',
   'WFRP 4ed stawia na brudny, niebezpieczny swiat i bohaterow, ktorzy czesto sa bardziej sprytni niz potezni.\n\nTypowy obieg sceny:\n1) Deklarujesz konkretna akcje.\n2) Mistrz okresla test i modyfikatory.\n3) Rzucasz k100 i porownujesz z cecha lub umiejetnoscia.\n4) Wynik przeklada sie na poziom sukcesu albo porazki.\n\nW praktyce liczy sie planowanie, wsparcie druzyny i zarzadzanie ryzykiem.'),

  ('wh4e', 'tests-and-sl', 'Warhammer 4ed: testy i poziomy sukcesu',
   'Wynik testu to nie tylko "weszlo / nie weszlo".\n\nPoziomy sukcesu (SL) pomagaja ocenic skale efektu:\n- wyzszy SL oznacza mocniejszy rezultat,\n- nizszy lub ujemny SL moze dac koszt, opoznienie albo komplikacje.\n\nPrzy testach przeciwstawnych porownuje sie SL obu stron. To sprawia, ze nawet zblizone rzuty moga dac bardzo rozne konsekwencje fabularne.'),

  ('wh4e', 'combat', 'Warhammer 4ed: walka i zagrozenia',
   'Walka jest szybka i potrafi byc brutalna.\n\nPrzydatne nawyki:\n- skupiaj ogien druzyny na jednym celu,\n- korzystaj z przewagi sytuacyjnej i oslon,\n- pamietaj, ze obrazenia i krytyki moga szybko zmienic sytuacje.\n\nNie kazde starcie trzeba wygrywac frontalnie. WFRP nagradza wycofanie, podstep i dobre przygotowanie.'),

  ('wh4e', 'career', 'Warhammer 4ed: profesje i rozwoj',
   'Rozwoj postaci opiera sie o profesje, a nie tylko o "poziom".\n\nProfesja podpowiada:\n- jakie umiejetnosci i talenty rozwijasz najlatwiej,\n- jak postac funkcjonuje w spoleczenstwie,\n- jakie ma kontakty i zobowiazania.\n\nZmiana profesji to czesto element fabuly: awans, upadek, nowy patron lub przetrwanie kryzysu.'),

  -- Pathfinder 2e
  ('pf2e', 'three-actions', 'Pathfinder 2ed: ekonomia trzech akcji',
   'Kazda tura daje zwykle trzy akcje i jedna reakcje.\n\nDzieki temu mozesz elastycznie laczyc ruch, atak, wsparcie i taktyke.\nPrzyklad tury:\n- akcja 1: podejscie,\n- akcja 2: atak,\n- akcja 3: podniesienie tarczy lub kolejny atak.\n\nTen system premiuje planowanie calej sekwencji, a nie pojedynczego "mocnego ruchu".'),

  ('pf2e', 'degrees', 'Pathfinder 2ed: stopnie powodzenia',
   'Wiele testow ma cztery poziomy wyniku:\n- krytyczny sukces,\n- sukces,\n- porazka,\n- krytyczna porazka.\n\nRoznica miedzy wynikiem a trudnoscia przesuwa rezultat w gore albo w dol. To sprawia, ze nawet ten sam czar czy umiejetnosc moze dac bardzo rozny efekt zaleznie od rzutu.'),

  ('pf2e', 'conditions', 'Pathfinder 2ed: warunki i statusy',
   'Warunki w PF2e sa precyzyjne i opisane liczbowo.\n\nZamiast ogolnego "masz kare", zwykle dostajesz konkretny stan, np. oslabienie, przestraszenie lub spowolnienie. Warunki lacza sie i schodza wedlug jasnych zasad, co ulatwia prowadzenie walki bez zgadywania.'),

  ('pf2e', 'encounter-balance', 'Pathfinder 2ed: budowanie starc',
   'Projektowanie starcia opiera sie o budzet zagrozenia dla druzyny.\n\nDobra praktyka:\n- mieszaj role przeciwnikow,\n- dawaj teren i oslonki do wykorzystania,\n- pilnuj celu sceny (nie kazda walka musi byc "do zera HP").\n\nPF2e dobrze dziala, gdy starcia maja taktyczne decyzje, a nie tylko wymiane obrazen.'),

  -- Mork Borg
  ('morkborg', 'tone', 'Mork Borg: klimat i zalozenia',
   'Mork Borg stawia na mroczny, punkowy klimat konca swiata.\n\nBohaterowie sa smiertelni, zasoby kruche, a rzeczywistosc czesto absurdalnie okrutna. Mechanika jest celowo lekka, by szybko przejsc do akcji i decyzji przy stole.'),

  ('morkborg', 'tests', 'Mork Borg: testy i tempo',
   'W wielu sytuacjach gracze rzucaja, aby uniknac zagrozenia albo wykonac ryzykowna akcje.\n\nTesty sa proste i szybkie, a wynik od razu pcha scene dalej. Nacisk jest na tempo, improwizacje i konsekwencje, nie na dlugie liczenie modyfikatorow.'),

  ('morkborg', 'combat', 'Mork Borg: walka i przetrwanie',
   'Walka bywa krotka, ale bardzo niebezpieczna.\n\nWazne podejscie:\n- unikaj niepotrzebnych starc,\n- wykorzystuj otoczenie,\n- licz sie z tym, ze rany i pech szybko eskaluja sytuacje.\n\nTo system, w ktorym spryt i ryzyko czesto znacza wiecej niz "idealny build".'),

  ('morkborg', 'loot-and-doom', 'Mork Borg: lup i zaglada',
   'Nagrody i przedmioty sa kuszace, ale swiat stale zmierza ku katastrofie.\n\nDobry styl gry to balans miedzy chciwoscia a rozsądkiem: ile ryzyka warto podjac, zanim wszystko sie posypie. Ta presja buduje klimat i nadaje decyzjom ciezar.')
ON CONFLICT (system_code, slug) DO NOTHING;
