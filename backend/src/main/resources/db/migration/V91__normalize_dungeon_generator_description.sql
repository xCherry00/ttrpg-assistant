-- Normalize dungeon generator catalog description introduced by earlier seed data.

UPDATE generator_definitions
SET description = 'Większy loch z regulowaną liczbą pomieszczeń i poziomów.'
WHERE name = 'Loch'
  AND description = 'Wiekszy loch z regulowana liczba pomieszczeń i poziomow.';
