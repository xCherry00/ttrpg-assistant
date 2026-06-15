-- Repair legacy mojibake/ASCII-only Polish text left by early rules and glossary seed migrations.
-- Historical migrations are not edited to avoid Flyway checksum drift on existing databases.

UPDATE glossary_terms
SET term_pl = 'Ekwipunek podróżny',
    definition = 'Podstawowe przedmioty używane między walkami: liny, racje, pochodnie, narzędzia i zapasy.'
WHERE system = 'uniwersalne'
  AND term_pl LIKE 'Ekwipunek podr%';

UPDATE glossary_terms
SET term_pl = 'Tło postaci',
    definition = 'Pakiet historii i motywacji postaci, który podpowiada jak odgrywać jej decyzje.'
WHERE system = 'uniwersalne'
  AND term_pl LIKE 'T%o postaci';

UPDATE glossary_terms
SET definition = 'Scena negocjacji, przesłuchania albo dyplomacji, gdzie kluczowe są argumenty i relacje.'
WHERE system = 'uniwersalne' AND term_pl = 'Spotkanie towarzyskie';

UPDATE glossary_terms
SET definition = 'Pojedyncze wyzwanie dla drużyny: walka, przeszkoda terenowa, zagadka lub scena społeczna.'
WHERE system = 'uniwersalne' AND term_pl = 'Encounter';

UPDATE glossary_terms
SET definition = 'Wyraźny wzorzec roli postaci, np. obrońca, zwiadowca, mistyk lub wsparcie.'
WHERE system = 'uniwersalne' AND term_pl = 'Archetyp';

UPDATE glossary_terms
SET definition = 'Czas pomiędzy wyprawami przeznaczony na trening, handel, leczenie i rozwijanie wątków pobocznych.'
WHERE system = 'uniwersalne' AND term_pl = 'Downtime';

UPDATE rules_pages
SET title = 'Warhammer 4ed: rdzeń gry',
    content = E'WFRP 4ed stawia na brudny, niebezpieczny świat i bohaterów, którzy często są bardziej sprytni niż potężni.\n\nTypowy obieg sceny:\n1) Deklarujesz konkretną akcję.\n2) Mistrz określa test i modyfikatory.\n3) Rzucasz k100 i porównujesz z cechą lub umiejętnością.\n4) Wynik przekłada się na poziom sukcesu albo porażki.\n\nW praktyce liczy się planowanie, wsparcie drużyny i zarządzanie ryzykiem.'
WHERE system_code = 'wh4e' AND slug = 'core-loop';
