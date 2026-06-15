-- Normalize older ASCII-only Polish snippets in generator catalog and seed pools.
-- This migration intentionally keeps identifiers/codes unchanged and only updates visible text payloads.

UPDATE generator_definitions
SET name = replace(replace(replace(replace(name, 'Swiat', 'Świat'), 'swiat', 'świat'), 'Mozliwy', 'Możliwy'), 'Mozliwa', 'Możliwa'),
    description = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(description,
      'swiat', 'świat'), 'Swiat', 'Świat'), 'magia', 'magią'), 'geografia', 'geografią'), 'rzadem', 'rządem'),
      'krolestwem', 'królestwem'), 'pelnej', 'pełnej'), 'generatorow', 'generatorów'), 'zrodlo', 'źródło'),
      'tresci', 'treści'), 'dostepne', 'dostępne'), 'tworcow', 'twórców')
WHERE name ~ '(Swiat|Mozliw)' OR description ~ '(swiat|Swiat|magia|geografia|rzadem|krolestwem|pelnej|generatorow|zrodlo|tresci|dostepne|tworcow)';

UPDATE generator_variants
SET name = replace(replace(replace(replace(name, 'Swiat', 'Świat'), 'swiat', 'świat'), 'Mozliwy', 'Możliwy'), 'Mozliwa', 'Możliwa'),
    description = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(description,
      'swiat', 'świat'), 'Swiat', 'Świat'), 'magia', 'magią'), 'geografia', 'geografią'), 'rzadem', 'rządem'),
      'krolestwem', 'królestwem'), 'pelnej', 'pełnej'), 'generatorow', 'generatorów'), 'zrodlo', 'źródło'), 'tresci', 'treści')
WHERE name ~ '(Swiat|Mozliw)' OR description ~ '(swiat|Swiat|magia|geografia|rzadem|krolestwem|pelnej|generatorow|zrodlo|tresci)';

UPDATE generator_field_definitions
SET label = replace(replace(replace(replace(replace(label,
  'Zrodlo', 'Źródło'), 'zrodlo', 'źródło'), 'Mozliwa', 'Możliwa'), 'Mozliwy', 'Możliwy'), 'Swiat', 'Świat')
WHERE label ~ '(Zrodlo|zrodlo|Mozliw|Swiat)';

UPDATE generator_pools
SET payload_json = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(payload_json::text,
  'swiat', 'świat'), 'Swiat', 'Świat'), 'ktory', 'który'), 'ktora', 'która'), 'ktore', 'które'), 'moze', 'może'),
  'zrodlo', 'źródło'), 'slad', 'ślad'), 'Slabosc', 'Słabość'), 'slabosc', 'słabość'), 'Sredni', 'Średni'),
  'druzyny', 'drużyny'), 'druzyna', 'drużyna'), 'wlasciciel', 'właściciel'), 'wiecej', 'więcej'), 'wiekszy', 'większy'),
  'uzyc', 'użyć'), 'uzycie', 'użycie'), 'uzywa', 'używa'), 'wyglada', 'wygląda')::jsonb
WHERE payload_json::text ~ '(swiat|Swiat|ktory|ktora|ktore|moze|zrodlo|slad|Slabosc|slabosc|Sredni|druzyn|wlasciciel|wiecej|wiekszy|uzyc|uzycie|uzywa|wyglada)';
