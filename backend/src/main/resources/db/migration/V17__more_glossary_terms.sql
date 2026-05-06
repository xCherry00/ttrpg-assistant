-- V17__more_glossary_terms.sql
-- Dodatkowe terminy słowniczka TTRPG

INSERT INTO glossary_terms (term_pl, term_en, definition, category, system, tags) VALUES

  ('Klasa Pancerza', 'Armor Class',
   'Wartość liczbowa określająca, jak trudno trafić postać. W D&D 5e bazowa KP wynosi 10 + modyfikator Zręczności. Każda próba ataku musi osiągnąć lub przekroczyć KP celu, aby zadać obrażenia.',
   'mechanika', 'dnd', 'KP,AC,obrona,pancerz'),

  ('Akcja Bonusowa', 'Bonus Action',
   'Dodatkowa, szybka akcja wykonywana w tej samej turze co główna akcja. Dostęp do akcji bonusowej dają konkretne zdolności, czary lub cechy klasy — sama w sobie nie daje żadnej czynności.',
   'walka', 'dnd', 'akcja,tura,mechanika'),

  ('Reakcja', 'Reaction',
   'Akcja wykonywana w odpowiedzi na konkretny wyzwalacz — np. atak okazji (gdy wróg opuszcza zasięg) lub czar Tarcza. Postać może wykonać tylko jedną reakcję między swoimi turami.',
   'walka', 'dnd', 'akcja,tura,mechanika'),

  ('Koncentracja', 'Concentration',
   'Mechanizm utrzymywania aktywnych czarów wymagających skupienia. Postać może koncentrować się tylko na jednym czarze naraz. Otrzymanie obrażeń wymaga testu Kondycji (trudność 10 lub połowa obrażeń) — porażka kończy koncentrację.',
   'magia', 'dnd', 'czary,koncentracja,mechanika'),

  ('Sloty Czarów', 'Spell Slots',
   'Zasoby wydawane przy rzucaniu czarów o wyższej niż magiczna sztuczka sile. Każdy slot ma poziom (1–9) — im wyższy, tym potężniejszy czar można nim rzucić. Odnawiane po długim odpoczynku.',
   'magia', 'dnd', 'czary,sloty,zasoby'),

  ('Proficjencja', 'Proficiency',
   'Bonus dodawany do rzutów dla umiejętności, broni, narzędzi lub rzutów obronnych, w których postać jest biegła. Wzrasta wraz z poziomem postaci: +2 na 1-4 poziomie, aż do +6 na 17-20.',
   'mechanika', 'dnd', 'proficiency,bonus,mechanika'),

  ('Inspiracja', 'Inspiration',
   'Żeton nagradzany przez MG za odgrywanie postaci zgodnie z jej tłem lub cechami. Można go wydać, aby uzyskać Przewagę na dowolny rzut ataku, testu zdolności lub rzutu obronnego.',
   'mechanika', 'dnd', 'inspiration,roleplaying'),

  ('Kości Życia', 'Hit Dice',
   'Kości służące do odnawiania punktów życia podczas krótkiego odpoczynku. Każda klasa ma inną kość życia (np. Wojownik k10, Czarodziej k6). Łączna liczba równa się poziomowi postaci.',
   'mechanika', 'dnd', 'HD,odpoczynek,HP'),

  ('Wieloklasowość', 'Multiclassing',
   'Wybór drugiej (lub kolejnej) klasy podczas zdobywania poziomu, zamiast rozwijania dotychczasowej. Pozwala łączyć zdolności różnych klas kosztem wolniejszego dostępu do zaawansowanych cech każdej z nich.',
   'postac', 'dnd', 'multiclass,klasa,build'),

  ('Zdolność Specjalna', 'Feat',
   'Opcjonalna cecha postaci zdobywana zamiast podwyższenia atrybutu. Daje unikalne umiejętności lub premie (np. Alert — +5 do Inicjatywy, War Caster — utrzymywanie koncentracji z Przewagą).',
   'postac', 'dnd', 'feat,cecha,build'),

  ('BBEG', 'Big Bad Evil Guy',
   'Główny antagonista kampanii lub przygody — osoba lub istota odpowiedzialna za zagrożenie, które bohaterowie muszą pokonać. Termin pochodzi ze slangu graczy i jest używany przez MG przy planowaniu fabuły.',
   'narracja', 'uniwersalne', 'bbeg,antagonista,villain'),

  ('MacGuffin', 'MacGuffin',
   'Przedmiot lub cel, który napędza fabułę i motywuje bohaterów do działania, jednak sam w sobie nie ma większego znaczenia narracyjnego. Przykłady: zaginiony artefakt, skradziony kod, tajemnicza walizka.',
   'narracja', 'uniwersalne', 'macguffin,fabuła,narracja'),

  ('Improwizacja MG', 'GM Improv',
   'Umiejętność tworzenia treści "na żywo" przez Mistrza Gry, gdy gracze schodzą z przygotowanej ścieżki. Klucz: zasada "tak, i..." — zaakceptuj akcję gracza i dodaj konsekwencję lub komplikację.',
   'mg', 'uniwersalne', 'improv,mg,narracja'),

  ('Obszar Efektu', 'Area of Effect',
   'Czary lub zdolności działające na obszar, nie na pojedynczy cel. Typowe kształty: sfera (Fireball — 20 stóp), stożek (Breath Weapon), linia (Lightning Bolt), sześcian. Każda postać w obszarze może być dotknięta.',
   'walka', 'dnd', 'AoE,czary,obszar,walka'),

  ('Rzut na Atak', 'Attack Roll',
   'Rzut k20 + modyfikator ataku (siła lub zręczność + bonus proficjencji) wykonywany przy próbie trafienia celu. Wynik musi równać się KP celu lub go przekraczać. Naturalne 20 to automatyczne trafienie i szansa na Krytyka.',
   'walka', 'dnd', 'atak,k20,mechanika'),

  ('Rzut na Obrażenia', 'Damage Roll',
   'Rzut kością obrażeń broni lub czaru po trafieniu, wskazujący liczbę punktów życia zabranych celowi. Przy trafieniu krytycznym rzucasz dwa razy tyloma kośćmi i dodajesz wyniki.',
   'walka', 'dnd', 'obrażenia,kości,mechanika'),

  ('Tura', 'Turn',
   'Pojedyncze działanie jednej postaci w ramach rundy walki. Podczas tury postać może wykonać: jedną Akcję, jeden Ruch (do wartości Prędkości), ewentualną Akcję Bonusową i jedną Reakcję.',
   'walka', 'uniwersalne', 'tura,runda,walka'),

  ('Runda', 'Round',
   'Jeden pełny cykl walki, w którym każda uczestnicząca postać wykonuje swoją turę (zazwyczaj reprezentuje ok. 6 sekund w świecie gry). Po zakończeniu rundy inicjatywa się nie losuje — kolejność pozostaje.',
   'walka', 'uniwersalne', 'runda,tura,walka'),

  ('Teren Trudny', 'Difficult Terrain',
   'Obszar spowalniający ruch — błoto, gruz, głęboka woda, gęste krzaki. Poruszanie się po terenie trudnym kosztuje dwa razy więcej Prędkości (każda stopa ruchu liczy się za dwie).',
   'walka', 'dnd', 'teren,ruch,walka'),

  ('Zasięg', 'Reach / Range',
   'Odległość, na jaką postać lub broń może działać. Zasięg dotykowy (Reach) — dla broni wręcz, zwykle 5 stóp (10 dla broni drzewcowych). Zasięg dystansowy (Range) — dla broni/czarów dystansowych, dwa zakresy: normalny i długi (z Utrudnieniem).',
   'walka', 'dnd', 'zasięg,broń,odległość'),

  ('Ochrona', 'Cover',
   'Osłona fizyczna zmniejszająca szansę bycia trafionym. Pół osłony: +2 do KP i rzutów obronnych na Zręczność. Trzy czwarte osłony: +5 do KP i rzutów obronnych. Pełna osłona: cel nie może być bezpośrednio atakowany.',
   'walka', 'dnd', 'cover,ochrona,obrona'),

  ('Karta Postaci', 'Character Sheet',
   'Dokument (papierowy lub cyfrowy) zawierający wszystkie informacje o postaci gracza: atrybuty, umiejętności, HP, wyposażenie, zdolności i historię. Podstawowe narzędzie każdego gracza.',
   'podstawy', 'uniwersalne', 'character-sheet,postać,formularz'),

  ('Awans Postaci', 'Level Up',
   'Zdobycie nowego poziomu postaci po uzbieraniu odpowiedniej liczby punktów doświadczenia (XP) lub po ukończeniu kamienia milowego fabuły. Awans przynosi nowe HP, zdolności klasy i co cztery poziomy wzrost atrybutów.',
   'mechanika', 'dnd', 'level-up,poziom,rozwój'),

  ('Ekran Mistrza Gry', 'GM Screen',
   'Fizyczna lub cyfrowa bariera zasłaniająca notatki i rzuty MG przed graczami. Zwykle zawiera najczęściej używane tabele i zasady dla szybkiego odniesienia. Utrzymuje tajemnicę planowania i buduje napięcie.',
   'mg', 'uniwersalne', 'ekran,mg,tabele'),

  ('Klimat Sesji', 'Session Tone / Mood',
   'Ogólny nastrój i atmosfera sesji — mroczna, komediowa, epicka, detektywistyczna. MG ustala go z graczami, zwłaszcza na Sesji Zerowej. Spójny klimat pomaga w odgrywaniu postaci i tworzeniu narracji.',
   'narracja', 'uniwersalne', 'klimat,atmosfera,nastrój');
