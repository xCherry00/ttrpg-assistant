-- Normalize remaining post-apo and sci-fi generator catalog descriptions.

UPDATE generator_definitions
SET description = 'Generuje hordę, kierunek, co ją przyciąga i możliwe rozwiązania.'
WHERE name = 'Horda'
  AND description = 'Generuje horde, kierunek, co ja przyciaga i mozliwe rozwiazania.';

UPDATE generator_definitions
SET name = 'Zagrożenie na statek',
    description = 'Generuje zagrożenie na pokładzie, pierwsze oznaki, eskalację i możliwe wyjście.'
WHERE name = 'Zagrozenie na statek'
  AND description = 'Generuje zagrożenie na pokladzie, pierwsze oznaki, eskalacje i mozliwe wyjscie.';
