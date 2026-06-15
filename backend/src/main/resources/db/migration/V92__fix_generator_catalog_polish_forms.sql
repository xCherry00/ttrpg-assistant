-- Fix over-broad and remaining ASCII Polish forms in generator catalog text.

UPDATE generator_definitions
SET description = replace(description, 'pomieszczeńie', 'pomieszczenie');

UPDATE generator_variants
SET description = replace(description, 'pomieszczeńie', 'pomieszczenie');

UPDATE generator_definitions
SET description = 'Generuje pojedyncze pomieszczenie, zawartość, zagrożenie i wyjścia.'
WHERE name = 'Pomieszczenie lochu'
  AND description = 'Generuje pojedyncze pomieszczenie, zawartość, zagrożenie i wyjscia.';

UPDATE generator_variants
SET description = 'Generuje pojedyncze pomieszczenie, zawartość, zagrożenie i wyjścia.'
WHERE name = 'Pomieszczenie lochu'
  AND description = 'Generuje pojedyncze pomieszczenie, zawartość, zagrożenie i wyjscia.';

UPDATE generator_definitions
SET description = 'Generuje konflikt między stronami, powód, eskalację i możliwe wyjścia.'
WHERE name = 'Konflikt postapo'
  AND description = 'Generuje konflikt miedzy stronami, powod, eskalacje i mozliwe wyjscia.';

UPDATE generator_variants
SET description = 'Generuje konflikt między stronami, powód, eskalację i możliwe wyjścia.'
WHERE name = 'Konflikt postapo'
  AND description = 'Generuje konflikt miedzy stronami, powod, eskalacje i mozliwe wyjscia.';

UPDATE generator_variants
SET description = 'Generuje hordę, kierunek, co ją przyciąga i możliwe rozwiązania.'
WHERE name = 'Horda'
  AND description = 'Generuje horde, kierunek, co ja przyciaga i mozliwe rozwiazania.';

UPDATE generator_variants
SET name = 'Zagrożenie na statku',
    description = 'Generuje zagrożenie na pokładzie, pierwsze oznaki, eskalację i możliwe wyjście.'
WHERE name = 'Zagrozenie na state'
  AND description = 'Generuje zagrożenie na pokladzie, pierwsze oznaki, eskalacje i mozliwe wyjscie.';
