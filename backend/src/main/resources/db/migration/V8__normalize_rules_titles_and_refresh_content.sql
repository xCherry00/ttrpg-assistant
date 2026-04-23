-- V8__normalize_rules_titles_and_refresh_content.sql
-- Ujednolicenie tytulow sekcji oraz odswiezenie tresci zasad

-- =========================
-- D&D 5e
-- =========================
UPDATE rules_pages
SET content = E'W D&D 5e większość testów opiera się o rzut k20.\n\nSzybki schemat:\n1) Rzuć k20.\n2) Dodaj modyfikator (cecha, biegłość, bonus sytuacyjny).\n3) Porównaj wynik z trudnością.\n\nNaturalna 20 zwykle oznacza wyjątkowo dobry wynik, a naturalna 1 pecha lub komplikację. Najważniejsze jest to, że rzut uruchamia konsekwencję fabularną, a nie tylko "tak/nie".'
WHERE system_code = 'dnd' AND slug = 'dice';

UPDATE rules_pages
SET content = E'Tura w walce zwykle dzieli się na ruch, akcję i czasem reakcję.\n\nDobre praktyki przy stole:\n- deklaruj zamiar krótko i konkretnie,\n- wspieraj pozycjonowanie drużyny,\n- nie bój się wycofania, gdy sytuacja jest zła.\n\nWalka działa najlepiej, gdy cele sceny są jasne: czasem trzeba wygrać starcie, a czasem tylko uratować zakładnika i uciec.'
WHERE system_code = 'dnd' AND slug = 'combat';

UPDATE rules_pages
SET content = E'Atrybuty opisują fundament postaci: siłę, zręczność, wytrzymałość, intelekt, mądrość i charyzmę.\n\nNie chodzi wyłącznie o liczby. To także wskazówka do odgrywania:\n- wysoka mądrość to dobra intuicja,\n- wysoka charyzma to wpływ na ludzi,\n- wysoka zręczność to kontrola ruchu i precyzja.\n\nMechanicznie atrybut daje modyfikator, ale fabularnie mówi, jak postać rozwiązuje problemy.'
WHERE system_code = 'dnd' AND slug = 'attributes';

UPDATE rules_pages
SET content = E'Odpoczynek porządkuje tempo kampanii.\n\nKrótki odpoczynek pozwala odzyskać część zasobów i złapać oddech po scenie.\nDługi odpoczynek resetuje większą część możliwości postaci, ale wymaga bezpiecznych warunków.\n\nDla Mistrza Gry to narzędzie kontroli napięcia: częste odpoczynki obniżają presję, rzadkie ją podkręcają.'
WHERE system_code = 'dnd' AND slug = 'rest';

UPDATE rules_pages
SET content = E'Magia w D&D to zarządzanie zasobami i decyzjami taktycznymi.\n\nPrzy rzucaniu czaru zwróć uwagę na:\n- koszt (slot lub inny zasób),\n- zasięg i warunki użycia,\n- efekt uboczny dla pozycji drużyny.\n\nNajlepsze użycie zaklęć często nie polega na maksymalnych obrażeniach, tylko na kontroli pola walki i zmianie tempa starcia.'
WHERE system_code = 'dnd' AND slug = 'spells';

-- =========================
-- Call of Cthulhu 7e
-- =========================
UPDATE rules_pages
SET title = 'Podstawy gry',
    content = E'Call of Cthulhu opiera się na grozie i bezsilności wobec rzeczy większych niż człowiek.\n\nTu rzadko chodzi o bohaterskie zwycięstwo. Częściej:\n- odkrywasz prawdę krok po kroku,\n- płacisz za wiedzę stresem i ryzykiem,\n- próbujesz przetrwać konsekwencje.'
WHERE system_code = 'cthulhu' AND slug = 'basics';

UPDATE rules_pages
SET title = 'Testy procentowe',
    content = E'Główny mechanizm to rzut k100 pod wartość umiejętności.\n\nIm niższy rzut, tym lepiej. Trudniejsze testy obniżają próg sukcesu.\n\nTo narzędzie świetnie wspiera klimat śledztwa: nawet dobry specjalista może popełnić błąd, a pojedyncza porażka potrafi uruchomić lawinę kłopotów.'
WHERE system_code = 'cthulhu' AND slug = 'basic-rules';

UPDATE rules_pages
SET title = 'Poczytalność',
    content = E'Sanity to zasób psychiczny postaci.\n\nKontakt z tym, co nieludzkie, potrafi ją naruszyć. Spadki poczytalności mogą dać:\n- chwilowe załamanie,\n- długofalowe lęki i obsesje,\n- zmianę sposobu działania bohatera.\n\nMechanika poczytalności to serce klimatu CoC.'
WHERE system_code = 'cthulhu' AND slug = 'sanity';

UPDATE rules_pages
SET title = 'Starcia i przemoc',
    content = E'W CoC otwarta walka jest zwykle ostatecznością.\n\nPraktyczne podejście:\n- najpierw zbierz informacje,\n- szukaj przewagi lub drogi odwrotu,\n- traktuj konfrontację jako ryzyko, nie rutynę.\n\nTo system, który premiuje ostrożność bardziej niż heroiczne szarże.'
WHERE system_code = 'cthulhu' AND slug = 'combat';

UPDATE rules_pages
SET title = 'Strach i napięcie',
    content = E'Strach jest częścią rozgrywki, nie tylko opisem klimatu.\n\nSceny grozy działają najlepiej, gdy gracze mają wybór między dwiema złymi opcjami: wejść głębiej i ryzykować, albo wycofać się i stracić szansę na odpowiedzi.'
WHERE system_code = 'cthulhu' AND slug = 'fear';

-- =========================
-- Warhammer 4ed
-- =========================
UPDATE rules_pages
SET title = 'Rdzeń gry',
    content = E'WFRP 4ed to świat brudu, polityki i ciężkich konsekwencji.\n\nStandardowy rytm sceny:\n1) deklaracja działania,\n2) test i modyfikatory,\n3) wynik z konsekwencją.\n\nMechanika dobrze działa, gdy decyzje są ryzykowne i mają cenę.'
WHERE system_code = 'wh4e' AND slug = 'core-loop';

UPDATE rules_pages
SET title = 'Testy i poziomy sukcesu',
    content = E'Poziomy sukcesu (SL) pokazują, jak bardzo akcja się udała lub nie.\n\nTo nie tylko "sukces/porażka".\nRóżnica między stronami przekłada się na tempo i skalę efektu, dlatego nawet podobne rzuty mogą prowadzić do innych wyników fabularnych.'
WHERE system_code = 'wh4e' AND slug = 'tests-and-sl';

UPDATE rules_pages
SET title = 'Walka i zagrożenia',
    content = E'Starcia w WFRP bywają szybkie i bolesne.\n\nSkuteczne podejście:\n- graj pod przewagę pozycji,\n- wspieraj drużynę, zamiast działać solo,\n- miej plan awaryjny.\n\nW tym systemie rozsądek jest równie ważny jak odwaga.'
WHERE system_code = 'wh4e' AND slug = 'combat';

UPDATE rules_pages
SET title = 'Profesje i rozwój',
    content = E'Postać rozwija się przez profesje, które określają jej miejsce w świecie.\n\nDzięki temu awans mechaniczny łączy się z fabułą: zmianą statusu, kontaktów i zobowiązań. Rozwój nie jest oderwany od historii kampanii.'
WHERE system_code = 'wh4e' AND slug = 'career';

-- =========================
-- Pathfinder 2ed
-- =========================
UPDATE rules_pages
SET title = 'Ekonomia trzech akcji',
    content = E'Każda tura daje trzy akcje i zwykle jedną reakcję.\n\nTo daje dużą elastyczność:\n- możesz przemieszczać się i atakować,\n- budować obronę,\n- przygotować grunt pod ruch sojusznika.\n\nPF2e nagradza planowanie sekwencji działań, nie pojedynczy "mocny cios".'
WHERE system_code = 'pf2e' AND slug = 'three-actions';

UPDATE rules_pages
SET title = 'Stopnie powodzenia',
    content = E'W PF2e wiele testów ma cztery wyniki: krytyczny sukces, sukces, porażka, krytyczna porażka.\n\nTo sprawia, że ten sam ruch może mieć różny ciężar zależnie od jakości rzutu. System dobrze oddaje "jak bardzo" coś się udało.'
WHERE system_code = 'pf2e' AND slug = 'degrees';

UPDATE rules_pages
SET title = 'Warunki i statusy',
    content = E'Warunki są precyzyjne i mają konkretne skutki mechaniczne.\n\nZamiast ogólnej kary dostajesz nazwany stan, który mówi dokładnie, co postać może, a czego nie. To przyspiesza rozstrzyganie sporów przy stole.'
WHERE system_code = 'pf2e' AND slug = 'conditions';

UPDATE rules_pages
SET title = 'Budowanie starć',
    content = E'Projektowanie spotkań opiera się o budżet zagrożenia i role przeciwników.\n\nDla prowadzącego to wygodny szkielet:\n- kontrolujesz poziom presji,\n- możesz mieszać typy wyzwań,\n- utrzymujesz równowagę bez ręcznego zgadywania trudności.'
WHERE system_code = 'pf2e' AND slug = 'encounter-balance';

-- =========================
-- Mork Borg
-- =========================
UPDATE rules_pages
SET title = 'Klimat i założenia',
    content = E'Mork Borg to szybka, brutalna gra o końcu świata.\n\nStyl prowadzenia:\n- krótko i ostro,\n- dużo presji,\n- mało bezpiecznych decyzji.\n\nMechanika ma wspierać tempo i nastrój, a nie zatrzymywać scenę długimi obliczeniami.'
WHERE system_code = 'morkborg' AND slug = 'tone';

UPDATE rules_pages
SET title = 'Testy i tempo',
    content = E'Testy są proste, więc szybko przechodzisz do konsekwencji.\n\nNajważniejsze pytanie brzmi: co się zmienia po rzucie?\nDzięki temu nawet krótka scena może mieć mocny, nieprzyjemny zwrot.'
WHERE system_code = 'morkborg' AND slug = 'tests';

UPDATE rules_pages
SET title = 'Walka i przetrwanie',
    content = E'Starcia są śmiertelne, więc plan i pozycja znaczą więcej niż brawura.\n\nDrużyna, która myśli o odwrocie i zasobach, zwykle żyje dłużej niż ta, która idzie na frontalne rozwiązania.'
WHERE system_code = 'morkborg' AND slug = 'combat';

UPDATE rules_pages
SET title = 'Łup i zagłada',
    content = E'Świat pcha się ku katastrofie, a łupy kuszą ryzykiem.\n\nTo gra o decyzjach pod presją: ile jeszcze możesz zaryzykować, zanim wszystko runie? Ten dylemat buduje napięcie niemal w każdej sesji.'
WHERE system_code = 'morkborg' AND slug = 'loot-and-doom';
