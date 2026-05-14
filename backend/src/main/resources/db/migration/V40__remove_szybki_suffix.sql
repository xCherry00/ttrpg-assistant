UPDATE generator_variants
SET name = TRIM(TRAILING ' szybki' FROM name)
WHERE name LIKE '% szybki';
