-- V6__fix_polish_chars_and_rules_format.sql
-- Poprawa polskich znakow i formatowania tresci zasad

-- =========================
-- GLOSSARY: POLISH DIACRITICS
-- =========================
UPDATE glossary_terms
SET definition = 'Samodzielna, zwykle krótka przygoda zamknięta w jednej sesji albo dwóch spotkaniach.'
WHERE term_pl = 'One-shot' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Spotkanie organizacyjne przed kampanią, podczas którego ustala się klimat gry, granice i zasady współpracy.'
WHERE term_pl = 'Session Zero' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Prowadzenie fabuły tak, aby gracze mieli bardzo mało realnych decyzji i musieli iść jednym torem.'
WHERE term_pl = 'Railroading' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Styl gry, w którym świat reaguje na decyzje graczy, a fabuła rozwija się głównie przez ich wybory.'
WHERE term_pl = 'Sandbox' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Element fabuły, który ma zainteresować drużynę i popchnąć akcję do przodu.'
WHERE term_pl = 'Hook fabularny' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Sytuacja, w której dwie strony rzucają, a lepszy wynik lub większy poziom sukcesu wygrywa.'
WHERE term_pl = 'Test przeciwstawny' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Modyfikacja rzutu polegająca na rzuceniu dwa razy i wybraniu lepszego albo gorszego wyniku, zależnie od sytuacji.'
WHERE term_pl = 'Advantage / Disadvantage' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Rzut obronny wykonywany, by uniknąć lub ograniczyć negatywny efekt, np. zaklęcia albo pułapki.'
WHERE term_pl = 'Save' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Stan postaci, który czasowo zmienia jej możliwości, np. osłupienie, zatrucie albo przewrócenie.'
WHERE term_pl = 'Condition' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Zdolności, które ograniczają ruch lub akcje przeciwników zamiast zadawać czyste obrażenia.'
WHERE term_pl = 'Crowd Control' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Rytm prowadzenia sceny: kiedy przyspieszyć wydarzenia, a kiedy dać miejsce na roleplay i decyzje.'
WHERE term_pl = 'Tempo sceny' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Świadoma korekta wcześniejszego elementu fabuły, aby utrzymać spójność albo naprawić błąd.'
WHERE term_pl = 'Retcon' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Podejście, w którym porażka rzutu nie zatrzymuje historii, tylko wprowadza koszt albo komplikacje.'
WHERE term_pl = 'Fail Forward' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Pakiet zagrożeń i wydarzeń, które rozwijają się w tle, jeśli drużyna ich nie zatrzyma.'
WHERE term_pl = 'Front' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Scena negocjacji, przesłuchania albo dyplomacji, gdzie kluczowe są argumenty i relacje.'
WHERE term_pl = 'Spotkanie towarzyskie' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Pojedyncze wyzwanie dla drużyny: walka, przeszkoda terenowa, zagadka lub scena społeczna.'
WHERE term_pl = 'Encounter' AND system = 'uniwersalne';

UPDATE glossary_terms
SET term_pl = 'Ekwipunek podróżny',
    definition = 'Podstawowe przedmioty używane między walkami: liny, racje, pochodnie, narzędzia i zapasy.'
WHERE term_pl = 'Ekwipunek podrĂłĹĽny' AND system = 'uniwersalne';

UPDATE glossary_terms
SET term_pl = 'Tło postaci',
    definition = 'Pakiet historii i motywacji postaci, który podpowiada jak odgrywać jej decyzje.'
WHERE term_pl = 'TĹ‚o postaci' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Wyraźny wzorzec roli postaci, np. obrońca, zwiadowca, mistyk lub wsparcie.'
WHERE term_pl = 'Archetyp' AND system = 'uniwersalne';

UPDATE glossary_terms
SET definition = 'Czas pomiędzy wyprawami przeznaczony na trening, handel, leczenie i rozwijanie wątków pobocznych.'
WHERE term_pl = 'Downtime' AND system = 'uniwersalne';

-- =========================
-- RULES: POLISH DIACRITICS + REAL NEWLINES
-- =========================
UPDATE rules_pages
SET title = 'Warhammer 4ed: rdzeń gry',
    content = E'WFRP 4ed stawia na brudny, niebezpieczny świat i bohaterów, którzy często są bardziej sprytni niż potężni.\n\nTypowy obieg sceny:\n1) Deklarujesz konkretną akcję.\n2) Mistrz określa test i modyfikatory.\n3) Rzucasz k100 i porównujesz z cechą lub umiejętnością.\n4) Wynik przekłada się na poziom sukcesu albo porażki.\n\nW praktyce liczy się planowanie, wsparcie drużyny i zarządzanie ryzykiem.'
WHERE system_code = 'wh4e' AND slug = 'core-loop';

UPDATE rules_pages
SET content = E'Wynik testu to nie tylko "weszło / nie weszło".\n\nPoziomy sukcesu (SL) pomagają ocenić skalę efektu:\n- wyższy SL oznacza mocniejszy rezultat,\n- niższy lub ujemny SL może dać koszt, opóźnienie albo komplikacje.\n\nPrzy testach przeciwstawnych porównuje się SL obu stron. To sprawia, że nawet zbliżone rzuty mogą dać bardzo różne konsekwencje fabularne.'
WHERE system_code = 'wh4e' AND slug = 'tests-and-sl';

UPDATE rules_pages
SET title = 'Warhammer 4ed: walka i zagrożenia',
    content = E'Walka jest szybka i potrafi być brutalna.\n\nPrzydatne nawyki:\n- skupiaj ogień drużyny na jednym celu,\n- korzystaj z przewagi sytuacyjnej i osłon,\n- pamiętaj, że obrażenia i krytyki mogą szybko zmienić sytuację.\n\nNie każde starcie trzeba wygrywać frontalnie. WFRP nagradza wycofanie, podstęp i dobre przygotowanie.'
WHERE system_code = 'wh4e' AND slug = 'combat';

UPDATE rules_pages
SET title = 'Warhammer 4ed: profesje i rozwój',
    content = E'Rozwój postaci opiera się o profesje, a nie tylko o "poziom".\n\nProfesja podpowiada:\n- jakie umiejętności i talenty rozwijasz najłatwiej,\n- jak postać funkcjonuje w społeczeństwie,\n- jakie ma kontakty i zobowiązania.\n\nZmiana profesji to często element fabuły: awans, upadek, nowy patron lub przetrwanie kryzysu.'
WHERE system_code = 'wh4e' AND slug = 'career';

UPDATE rules_pages
SET title = 'Pathfinder 2ed: ekonomia trzech akcji',
    content = E'Każda tura daje zwykle trzy akcje i jedną reakcję.\n\nDzięki temu możesz elastycznie łączyć ruch, atak, wsparcie i taktykę.\nPrzykład tury:\n- akcja 1: podejście,\n- akcja 2: atak,\n- akcja 3: podniesienie tarczy lub kolejny atak.\n\nTen system premiuje planowanie całej sekwencji, a nie pojedynczego "mocnego ruchu".'
WHERE system_code = 'pf2e' AND slug = 'three-actions';

UPDATE rules_pages
SET content = E'Wiele testów ma cztery poziomy wyniku:\n- krytyczny sukces,\n- sukces,\n- porażka,\n- krytyczna porażka.\n\nRóżnica między wynikiem a trudnością przesuwa rezultat w górę albo w dół. To sprawia, że nawet ten sam czar czy umiejętność może dać bardzo różny efekt zależnie od rzutu.'
WHERE system_code = 'pf2e' AND slug = 'degrees';

UPDATE rules_pages
SET content = E'Warunki w PF2e są precyzyjne i opisane liczbowo.\n\nZamiast ogólnego "masz karę", zwykle dostajesz konkretny stan, np. osłabienie, przestraszenie lub spowolnienie. Warunki łączą się i schodzą według jasnych zasad, co ułatwia prowadzenie walki bez zgadywania.'
WHERE system_code = 'pf2e' AND slug = 'conditions';

UPDATE rules_pages
SET title = 'Pathfinder 2ed: budowanie starć',
    content = E'Projektowanie starcia opiera się o budżet zagrożenia dla drużyny.\n\nDobra praktyka:\n- mieszaj role przeciwników,\n- dawaj teren i osłonki do wykorzystania,\n- pilnuj celu sceny (nie każda walka musi być "do zera HP").\n\nPF2e dobrze działa, gdy starcia mają taktyczne decyzje, a nie tylko wymianę obrażeń.'
WHERE system_code = 'pf2e' AND slug = 'encounter-balance';

UPDATE rules_pages
SET title = 'Mork Borg: klimat i założenia',
    content = E'Mork Borg stawia na mroczny, punkowy klimat końca świata.\n\nBohaterowie są śmiertelni, zasoby kruche, a rzeczywistość często absurdalnie okrutna. Mechanika jest celowo lekka, by szybko przejść do akcji i decyzji przy stole.'
WHERE system_code = 'morkborg' AND slug = 'tone';

UPDATE rules_pages
SET content = E'W wielu sytuacjach gracze rzucają, aby uniknąć zagrożenia albo wykonać ryzykowną akcję.\n\nTesty są proste i szybkie, a wynik od razu pcha scenę dalej. Nacisk jest na tempo, improwizację i konsekwencje, nie na długie liczenie modyfikatorów.'
WHERE system_code = 'morkborg' AND slug = 'tests';

UPDATE rules_pages
SET content = E'Walka bywa krótka, ale bardzo niebezpieczna.\n\nWażne podejście:\n- unikaj niepotrzebnych starć,\n- wykorzystuj otoczenie,\n- licz się z tym, że rany i pech szybko eskalują sytuację.\n\nTo system, w którym spryt i ryzyko często znaczą więcej niż "idealny build".'
WHERE system_code = 'morkborg' AND slug = 'combat';

UPDATE rules_pages
SET title = 'Mork Borg: łup i zagłada',
    content = E'Nagrody i przedmioty są kuszące, ale świat stale zmierza ku katastrofie.\n\nDobry styl gry to balans między chciwością a rozsądkiem: ile ryzyka warto podjąć, zanim wszystko się posypie. Ta presja buduje klimat i nadaje decyzjom ciężar.'
WHERE system_code = 'morkborg' AND slug = 'loot-and-doom';
