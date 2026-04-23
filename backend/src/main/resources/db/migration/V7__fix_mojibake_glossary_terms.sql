-- V7__fix_mojibake_glossary_terms.sql
-- Naprawa wpisow slowniczka zapisanych z blednym kodowaniem

UPDATE glossary_terms
SET term_pl = 'Ekwipunek podróżny',
    definition = 'Podstawowe przedmioty używane między walkami: liny, racje, pochodnie, narzędzia i zapasy.'
WHERE tags = 'ekwipunek,podroz' AND system = 'uniwersalne';

UPDATE glossary_terms
SET term_pl = 'Tło postaci',
    definition = 'Pakiet historii i motywacji postaci, który podpowiada jak odgrywać jej decyzje.'
WHERE tags = 'background,postac' AND system = 'uniwersalne';
