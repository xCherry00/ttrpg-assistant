-- V2__seed_core_data.sql
-- Dane startowe (słownik + przykładowe strony zasad)

-- =========================
-- GLOSSARY SEED
-- =========================
INSERT INTO glossary_terms (term_pl, term_en, definition, category, system, tags)
VALUES
  ('Mistrz Gry', 'Game Master / Dungeon Master',
   'Osoba prowadząca grę — organizuje rozgrywkę, opisuje świat oraz kontroluje postacie niezależne (NPC) i wydarzenia.',
   'podstawy', 'uniwersalne', 'gm,dm,podstawy'),

  ('Postać Gracza', 'Player Character',
   'Postać w grze kontrolowana przez gracza, a nie przez Mistrza Gry.',
   'postacie', 'uniwersalne', 'pc,postacie'),

  ('Postać Niezależna', 'Non-Player Character',
   'Postacie kontrolowane przez Mistrza Gry. Zaludniają świat i wchodzą w interakcje z postaciami graczy.',
   'postacie', 'uniwersalne', 'npc,postacie'),

  ('Kampania', 'Campaign',
   'Seria sesji gry połączonych wspólną fabułą lub zestawem powiązanych przygód.',
   'narracja', 'uniwersalne', 'kampania,fabula'),

  ('Sesja', 'Session',
   'Jedno spotkanie, podczas którego rozgrywana jest gra; zwykle trwa kilka godzin.',
   'narracja', 'uniwersalne', 'sesja'),

  ('Przygoda', 'Adventure',
   'Konkretne zadanie, misja lub wątek fabularny w ramach kampanii.',
   'narracja', 'uniwersalne', 'quest,przygoda'),

  ('Rzut', 'Dice Roll',
   'Czynność polegająca na rzuceniu kośćmi w celu określenia wyniku działania. Typ kości oznacza się literą „d” i liczbą ścian (np. d20).',
   'mechanika', 'uniwersalne', 'kosci,mechanika'),

  ('Punkty Życia', 'Hit Points',
   'Miara zdrowia postaci. Gdy HP spadnie do zera, postać zazwyczaj jest nieprzytomna lub martwa.',
   'mechanika', 'uniwersalne', 'hp,zycie'),

  ('Atrybuty', 'Ability Scores',
   'Wartości liczbowe opisujące podstawowe cechy postaci, takie jak siła, zręczność czy inteligencja.',
   'mechanika', 'uniwersalne', 'atrybuty,statystyki'),

  ('Inicjatywa', 'Initiative',
   'Określa kolejność, w jakiej postacie działają podczas walki lub innych dynamicznych wydarzeń.',
   'walka', 'uniwersalne', 'inicjatywa,walka'),

  ('Walka', 'Combat',
   'Ustrukturyzowana sekwencja tur, w której postacie biorą udział w starciu.',
   'walka', 'uniwersalne', 'combat,walka'),

  ('Trafienie Krytyczne / Krytyczna Porażka', 'Critical Hit / Critical Fail',
   'Wyjątkowo dobry lub zły wynik rzutu kością, zwykle naturalne 20 lub 1 na k20.',
   'walka', 'uniwersalne', 'krytyk,kosci'),

  ('Odgrywanie ról', 'Roleplaying',
   'Odgrywanie działań, decyzji i dialogów postaci poprzez narrację i interakcję.',
   'narracja', 'uniwersalne', 'rp,narracja'),

  ('Lore', 'Lore',
   'Historia świata gry, tło fabularne oraz szczegóły worldbuildingu.',
   'narracja', 'uniwersalne', 'lore,worldbuilding'),

  ('Metagranie', 'Metagaming',
   'Wykorzystywanie przez gracza wiedzy spoza gry, do której postać nie ma dostępu.',
   'meta', 'uniwersalne', 'meta,metagranie'),

  ('Zasady Domowe', 'House Rules',
   'Dodatkowe lub zmodyfikowane zasady wprowadzone przez Mistrza Gry lub grupę.',
   'meta', 'uniwersalne', 'houserules'),

  ('RPG', 'Role-Playing Game',
   'Gra fabularna — pojęcie nadrzędne obejmujące zarówno gry stołowe, jak i gry wideo.',
   'podstawy', 'uniwersalne', 'rpg'),

  ('TTRPG / TRPG', 'Tabletop Role-Playing Game',
   'Stołowa gra fabularna, używana do odróżnienia jej od komputerowych RPG.',
   'podstawy', 'uniwersalne', 'ttrpg,trpg')
ON CONFLICT (term_pl, system) DO NOTHING;

-- =========================
-- RULES PAGES SEED
-- =========================
INSERT INTO rules_pages(system_code, slug, title, content)
VALUES
  -- D&D 5e Rules
  ('dnd', 'dice', 'Rzuty kośćmi',
   'W DnD 5e większość testów opiera się o k20 (dwudziestościany).\n\nPodstawowe rzuty:\n• Rzuć k20 (naturalny rzut)\n• Dodaj odpowiedni modyfikator (atrybut + bonus kompetencji)\n• Porównaj wynik z Trudnością (ST - Saving Throw)\n\nWyniki:\n• 20 (natural 20): Zawsze sukces - trafienie krytyczne\n• 1 (natural 1): Zawsze porażka - porażka krytyczna\n• Pozostałe: Dodaj modyfikator i porównaj z ST'),

  ('dnd', 'combat', 'Walka',
   'Kolejność akcji w turze:\n1) Określ Inicjatywę (rzut k20 + modyfikator Zręczności)\n2) Gracze i potwory działają w kolejności inicjatywy\n3) Każda postać wykonuje w swojej turze:\n   • Akcja (atak, rzucenie zaklęcia, użycie przedmiotu)\n   • Ruch (do 6m zwykle)\n   • Interakcja darmowa (otwarcie drzwi, wyjęcie przedmiotu)\n   • Czasami Reakcja (AoO - Attack of Opportunity)\n\nAtak:\n• Rzuć k20 + modyfikator ataku\n• Porównaj z Klasą Pancerza (KP) celu\n• Jeśli trafisz: rzuć k4/k6/k8/k10/k12 + modyfikator (zależy od broni)'),

  ('dnd', 'attributes', 'Atrybuty',
   'Sześć głównych atrybutów (każdy od 3 do 20):\n\n• Siła (STR) - mięśnie, zdolności fizyczne\n• Zręczność (DEX) - szybkość, refleks, równowaga\n• Wytrzymałość (CON) - zdrowie, opór na zmęczenie\n• Intelekt (INT) - wiedza, logika, nauka\n• Mądrość (WIS) - percepcja, intuicja\n• Charyzma (CHA) - osobowość, przywództwo\n\nModyfikator = (atrybut - 10) / 2 (zaokrąglone w dół)\nNp. atrybut 14 = modyfikator +2'),

  ('dnd', 'rest', 'Odpoczynek',
   'Dwa rodzaje odpoczynku:\n\nKrótki odpoczynek:\n• Czas: 1 godzina\n• Efekt: Odzyskaj użyty hit die (może być więcej)\n• HP: Rzuć hit die + CON modyfikator\n\nDługi odpoczynek:\n• Czas: 8 godzin (w większości spania)\n• Warunek: Nie mogłeś być w pełni zaatakowany\n• Efekt: Odzyskaj wszystkie HP i Half-Spellslots\n• Maksimum 1x na 24h'),

  ('dnd', 'spells', 'Zaklęcia',
   'Zaklęcia mogą być rzucane przez Czarowników, Kapłanów, Bardów itp.\n\nRangi zaklęć: 0 (truczenie) - 9\n\nRzucanie zaklęcia:\n• Sprawdź czy masz slot zaklęcia odpowiedniego poziomu\n• Wykonaj rzut, jeśli wymagany (zaklęcia zawsze trafią, bez sprawdzania)\n• Atak zaklęciem: k20 + modyfikator zaklęcia\n• Zapis na zaklęciu: rzut o ST zaklęcia bezpieczności (save)\n\nSloty zaklęć:\n• Odzyskane po długim odpoczynku\n• Liczba sloców zależy od poziomu i klasy'),

  -- Call of Cthulhu 7th Edition Rules
  ('cthulhu', 'basics', 'Podstawy',
   'Call of Cthulhu to gra grozy i psychicznych horrorów w świecie Lovecrafta.\n\nCelem zwykle jest:\n• Przetrwanie (mnóstwo potwór chce cię zabić)\n• Ocalenie majątku psychicznego (szaleństwo czeka)\n• Rozwiązanie tajemnicy (nieludzkie przejawy)\n\nGra jest osadzona w latach 1920., choć dostępne są wersje w innych epokach.\nP.O.V. gracza: jesteś zwyczajnym człowiekiem, który zostaje wciągnięty w nieludzkie wydarzenia.'),

  ('cthulhu', 'basic-rules', 'Zasady Podstawowe',
   'Rzuty:\n• d100 (percentyl) - główne narzędzie do testów\n• Rzucasz i porównujesz z trudnością (próg procentowy)\n• Poniżej lub równe próg = sukces\n• Powyżej = porażka\n\nUmiejętności:\n• Każda postać ma umiejętności (np. Strzelanie, Tajemna Wiedza)\n• Każda między 0% a 99%\n\nTrudność:\n• Łatwo: 1-20% ponad umiejętność\n• Normalnie: twoja umiejętność\n• Trudno: pół umiejętności\n• Bardzo trudno: 1/5 umiejętności'),

  ('cthulhu', 'sanity', 'Punkty Rozumu (Sanity)',
   'Reprezentują zdrowotę psychiczne investigate.\n\nTracenie Sanity:\n• Spotkanie z Wielkim Starym lub jego sługami\n• Odkrycie straszliwych prawdy\n• Zagrożenie życiem lub szaleństwo\n\nUttrata Sanity:\n• Mała ilość (1-5) - dyskomfort, ale da się wytrzymać\n• Duża ilość (6+) - możliwe czasowe szaleństwo\n• Sanity = 0: chodzisz szalony na zawsze\n\nOdzyskanie Sanity:\n• Długi odpoczynek i spokój\n• Terapia psychologa\n• Czasami nigdy się nie odzyskuje...'),

  ('cthulhu', 'combat', 'Walka',
   'Walka zwykle oznacza kres kampanii.\n\nRunda walki:\n1) Wszystkie postacie działają jednocześnie lub w porządku zainicjowanym\n2) Każdy gracz opisuje akcję\n3) Wykonaj rzut do trafienia (atrybut + umiejętność broni)\n4) Porównaj z Klasą Pancerza wroga\n5) Jeśli trafisz: rzuć obrażenia (k6, k8, czy inne - zależy od broni)\n\nN.P.C.:\n• Zwyczajni ludzie mają 10 HP\n• Potwory/Great Old Ones mają WIELE HP\n• Przeniesienie tej walki to najlepsza taktyka'),

  ('cthulhu', 'fear', 'Strach i Horror',
   'Strach to najważniejszy aspekt Call of Cthulhu.\n\nRzuty na Strach:\n• Testują zbrojność psychiczną (Will)\n• Możliwe sukcesy, porażki i porażki krytyczne\n\nEffekty porażki:\n• Czasowe szaleństwo: biegaj, atakuj, coś się robi\n• Długotrwałe fobie/manie\n• Strata Sanity\n\nStrategią jest UNIKANIE konfrontacji i szukanie wiedzy, nie walki.')
ON CONFLICT (system_code, slug) DO NOTHING;
