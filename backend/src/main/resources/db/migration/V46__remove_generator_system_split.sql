-- Generatory mają być settingowe/ogólne, bez wariantów mechanicznych dla konkretnych systemów.
UPDATE generator_variants
SET is_active = false
WHERE system_code NOT IN ('system_agnostic', 'any');

UPDATE generator_variants
SET system_code = 'system_agnostic'
WHERE is_active = true
  AND system_code = 'any';

UPDATE generator_definitions
SET system_tags = '["system_agnostic"]'::jsonb,
    updated_at = now()
WHERE is_active = true;

UPDATE generator_variants
SET name = regexp_replace(name, '\s*(D&D 5E|D&D|CoC 7E|Call of Cthulhu 7E|Alien RPG|The Walking Dead|Warhammer 4E|Pathfinder 2E|Mörk Borg)\s*', '', 'gi'),
    description = regexp_replace(description, '\s*(D&D 5E|D&D|CoC 7E|Call of Cthulhu 7E|Alien RPG|The Walking Dead|Warhammer 4E|Pathfinder 2E|Mörk Borg)\s*', '', 'gi')
WHERE is_active = true;
