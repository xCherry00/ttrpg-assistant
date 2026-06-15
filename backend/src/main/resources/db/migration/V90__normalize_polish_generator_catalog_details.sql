-- Normalize additional Polish text in generator catalog and saved outputs.

CREATE OR REPLACE FUNCTION pg_temp.normalize_generator_catalog_details(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  value := replace(value, 'Generator lochu z mapa, poziomami i lista pomieszczen.', 'Generator lochu z mapą, poziomami i listą pomieszczeń.');
  value := replace(value, 'pomieszczen', 'pomieszczeń');
  value := replace(value, 'z mapa', 'z mapą');
  value := replace(value, 'i lista pomieszczeń', 'i listą pomieszczeń');
  value := replace(value, 'Wazne', 'Ważne');
  value := replace(value, 'przysiag', 'przysiąg');
  value := replace(value, 'straznicza', 'strażnicza');
  value := replace(value, 'narzedzi', 'narzędzi');
  value := replace(value, 'Zawartosc', 'Zawartość');
  value := replace(value, 'polamany', 'połamany');
  value := replace(value, 'oltarz', 'ołtarz');
  value := replace(value, 'czyms', 'czymś');
  value := replace(value, 'zabrac', 'zabrać');
  value := replace(value, 'ciezarem', 'ciężarem');
  value := replace(value, 'powyzej', 'powyżej');
  value := replace(value, 'polowy', 'połowy');
  value := replace(value, 'czlowieka', 'człowieka');
  value := replace(value, 'Wyslowienie', 'Wysłowienie');
  value := replace(value, 'kanalow', 'kanałów');
  value := replace(value, 'swieca', 'świeca');
  value := replace(value, 'palaca', 'paląca');
  value := replace(value, 'zamknieta', 'zamknięta');
  value := replace(value, 'szkatulka', 'szkatułka');
  value := replace(value, 'wskazujacy', 'wskazujący');
  value := replace(value, 'osobe', 'osobę');
  value := replace(value, 'pudelko', 'pudełko');
  value := replace(value, 'Goraczka', 'Gorączka');
  value := replace(value, 'oslabienie', 'osłabienie');
  value := replace(value, 'bezsennosc', 'bezsenność');
  value := replace(value, 'Zarazliwosc', 'Zaraźliwość');
  value := replace(value, 'Wodociagow', 'Wodociągów');

  RETURN value;
END
$$;

UPDATE generator_definitions
SET name = pg_temp.normalize_generator_catalog_details(name),
    description = pg_temp.normalize_generator_catalog_details(description)
WHERE concat_ws(' ', name, description) ~ '(pomieszczen|z mapa|Wazne|przysiag|straznicza|narzedzi|Zawartosc|polamany|oltarz|czyms|zabrac|ciezarem|powyzej|polowy|czlowieka|Wyslowienie|kanalow|swieca|palaca|zamknieta|szkatulka|wskazujacy|osobe|pudelko|Goraczka|oslabienie|bezsennosc|Zarazliwosc|Wodociagow)';

UPDATE generator_variants
SET name = pg_temp.normalize_generator_catalog_details(name),
    description = pg_temp.normalize_generator_catalog_details(description)
WHERE concat_ws(' ', name, description) ~ '(pomieszczen|z mapa|Wazne|przysiag|straznicza|narzedzi|Zawartosc|polamany|oltarz|czyms|zabrac|ciezarem|powyzej|polowy|czlowieka|Wyslowienie|kanalow|swieca|palaca|zamknieta|szkatulka|wskazujacy|osobe|pudelko|Goraczka|oslabienie|bezsennosc|Zarazliwosc|Wodociagow)';

UPDATE generator_field_definitions
SET label = pg_temp.normalize_generator_catalog_details(label),
    default_value = pg_temp.normalize_generator_catalog_details(default_value),
    options_json = pg_temp.normalize_generator_catalog_details(options_json::text)::jsonb
WHERE concat_ws(' ', label, default_value, options_json::text) ~ '(pomieszczen|z mapa|Wazne|przysiag|straznicza|narzedzi|Zawartosc|polamany|oltarz|czyms|zabrac|ciezarem|powyzej|polowy|czlowieka|Wyslowienie|kanalow|swieca|palaca|zamknieta|szkatulka|wskazujacy|osobe|pudelko|Goraczka|oslabienie|bezsennosc|Zarazliwosc|Wodociagow)';

UPDATE generator_pools
SET payload_json = pg_temp.normalize_generator_catalog_details(payload_json::text)::jsonb
WHERE payload_json::text ~ '(pomieszczen|z mapa|Wazne|przysiag|straznicza|narzedzi|Zawartosc|polamany|oltarz|czyms|zabrac|ciezarem|powyzej|polowy|czlowieka|Wyslowienie|kanalow|swieca|palaca|zamknieta|szkatulka|wskazujacy|osobe|pudelko|Goraczka|oslabienie|bezsennosc|Zarazliwosc|Wodociagow)';

UPDATE generator_results
SET title = pg_temp.normalize_generator_catalog_details(title),
    summary = pg_temp.normalize_generator_catalog_details(summary),
    output_json = pg_temp.normalize_generator_catalog_details(output_json::text)::jsonb
WHERE concat_ws(' ', title, summary, output_json::text) ~ '(pomieszczen|z mapa|Wazne|przysiag|straznicza|narzedzi|Zawartosc|polamany|oltarz|czyms|zabrac|ciezarem|powyzej|polowy|czlowieka|Wyslowienie|kanalow|swieca|palaca|zamknieta|szkatulka|wskazujacy|osobe|pudelko|Goraczka|oslabienie|bezsennosc|Zarazliwosc|Wodociagow)';
