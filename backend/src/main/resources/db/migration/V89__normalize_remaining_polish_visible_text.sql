-- Normalize remaining ASCII-only Polish snippets in visible generator text.
-- Codes, field keys and technical identifiers are intentionally left unchanged.

CREATE OR REPLACE FUNCTION pg_temp.normalize_visible_polish_text(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  value := replace(value, 'postac', 'postać');
  value := replace(value, 'powiazana', 'powiązana');
  value := replace(value, 'powiazane', 'powiązane');
  value := replace(value, 'zagrozeniem', 'zagrożeniem');
  value := replace(value, 'zagrozenia', 'zagrożenia');
  value := replace(value, 'zagrozenie', 'zagrożenie');
  value := replace(value, 'wskazowka', 'wskazówka');
  value := replace(value, 'sledztwa', 'śledztwa');
  value := replace(value, 'sledztwo', 'śledztwo');
  value := replace(value, 'sledczej', 'śledczej');
  value := replace(value, 'Sledczy', 'Śledczy');
  value := replace(value, 'Swiadek', 'Świadek');
  value := replace(value, 'Ocalaly', 'Ocalały');
  value := replace(value, 'ocalalego', 'ocalałego');
  value := replace(value, 'umiejetnosciami', 'umiejętnościami');
  value := replace(value, 'umiejetnosc', 'umiejętność');
  value := replace(value, 'Zawod', 'Zawód');
  value := replace(value, 'Rytual', 'Rytuał');
  value := replace(value, 'Poscig', 'Pościg');
  value := replace(value, 'Podroz', 'Podróż');
  value := replace(value, 'Srednie', 'Średnie');
  value := replace(value, 'Sredni', 'Średni');
  value := replace(value, 'Uzyteczny', 'Użyteczny');
  value := replace(value, 'Rzadkosc', 'Rzadkość');
  value := replace(value, 'wartosc', 'wartość');
  value := replace(value, 'Glowne', 'Główne');
  value := replace(value, 'Glowny', 'Główny');
  value := replace(value, 'Czesciowa', 'Częściowa');
  value := replace(value, 'Widocznosc', 'Widoczność');
  value := replace(value, 'Wiarygodnosc', 'Wiarygodność');
  value := replace(value, 'Falszywa', 'Fałszywa');
  value := replace(value, 'falszywy', 'fałszywy');
  value := replace(value, 'falszywa', 'fałszywa');
  value := replace(value, 'Krag', 'Krąg');
  value := replace(value, 'Siec', 'Sieć');
  value := replace(value, 'Zaloga', 'Załoga');
  value := replace(value, 'wplyw', 'wpływ');
  value := replace(value, 'zasobow', 'zasobów');
  value := replace(value, 'zasob', 'zasób');
  value := replace(value, 'spoleczny', 'społeczny');
  value := replace(value, 'spolecznosc', 'społeczność');
  value := replace(value, 'kryjowki', 'kryjówki');
  value := replace(value, 'dostep', 'dostęp');
  value := replace(value, 'dokumentow', 'dokumentów');
  value := replace(value, 'kurierow', 'kurierów');
  value := replace(value, 'wdziecznosci', 'wdzięczności');
  value := replace(value, 'czlowiek', 'człowiek');
  value := replace(value, 'strazy', 'straży');
  value := replace(value, 'slychac', 'słychać');
  value := replace(value, 'generatorow', 'generatorów');

  RETURN value;
END
$$;

UPDATE generator_definitions
SET name = pg_temp.normalize_visible_polish_text(name),
    description = pg_temp.normalize_visible_polish_text(description)
WHERE concat_ws(' ', name, description) ~ '(postac|powiaz|zagroz|wskazow|sled|Swiadek|Ocalaly|umiejet|Rytual|Poscig|Podroz|Sredni|Uzyteczny|Rzadkosc|Glow|Czesci|Widoczn|Wiarygodn|Falsz|fals|Krag|Siec|Zaloga|wplyw|zasob|spolecz|kryjow|dostep|dokumentow|kurierow|wdziecz|czlowiek|strazy|slychac|generatorow)';

UPDATE generator_variants
SET name = pg_temp.normalize_visible_polish_text(name),
    description = pg_temp.normalize_visible_polish_text(description)
WHERE concat_ws(' ', name, description) ~ '(postac|powiaz|zagroz|wskazow|sled|Swiadek|Ocalaly|umiejet|Rytual|Poscig|Podroz|Sredni|Uzyteczny|Rzadkosc|Glow|Czesci|Widoczn|Wiarygodn|Falsz|fals|Krag|Siec|Zaloga|wplyw|zasob|spolecz|kryjow|dostep|dokumentow|kurierow|wdziecz|czlowiek|strazy|slychac|generatorow)';

UPDATE generator_field_definitions
SET label = pg_temp.normalize_visible_polish_text(label),
    default_value = pg_temp.normalize_visible_polish_text(default_value),
    options_json = pg_temp.normalize_visible_polish_text(options_json::text)::jsonb
WHERE concat_ws(' ', label, default_value, options_json::text) ~ '(postac|powiaz|zagroz|wskazow|sled|Swiadek|Ocalaly|umiejet|Rytual|Poscig|Podroz|Sredni|Uzyteczny|Rzadkosc|Glow|Czesci|Widoczn|Wiarygodn|Falsz|fals|Krag|Siec|Zaloga|wplyw|zasob|spolecz|kryjow|dostep|dokumentow|kurierow|wdziecz|czlowiek|strazy|slychac|generatorow)';

UPDATE generator_pools
SET payload_json = pg_temp.normalize_visible_polish_text(payload_json::text)::jsonb
WHERE payload_json::text ~ '(postac|powiaz|zagroz|wskazow|sled|Swiadek|Ocalaly|umiejet|Rytual|Poscig|Podroz|Sredni|Uzyteczny|Rzadkosc|Glow|Czesci|Widoczn|Wiarygodn|Falsz|fals|Krag|Siec|Zaloga|wplyw|zasob|spolecz|kryjow|dostep|dokumentow|kurierow|wdziecz|czlowiek|strazy|slychac|generatorow)';

UPDATE generator_results
SET title = pg_temp.normalize_visible_polish_text(title),
    summary = pg_temp.normalize_visible_polish_text(summary),
    output_json = pg_temp.normalize_visible_polish_text(output_json::text)::jsonb
WHERE concat_ws(' ', title, summary, output_json::text) ~ '(postac|powiaz|zagroz|wskazow|sled|Swiadek|Ocalaly|umiejet|Rytual|Poscig|Podroz|Sredni|Uzyteczny|Rzadkosc|Glow|Czesci|Widoczn|Wiarygodn|Falsz|fals|Krag|Siec|Zaloga|wplyw|zasob|spolecz|kryjow|dostep|dokumentow|kurierow|wdziecz|czlowiek|strazy|slychac|generatorow)';
