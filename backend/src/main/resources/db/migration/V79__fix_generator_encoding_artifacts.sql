CREATE OR REPLACE FUNCTION fix_generator_encoding_artifacts(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF value IS NULL THEN
        RETURN NULL;
    END IF;

    value := replace(value, 'Ä‚ËĂ˘â€šÂ¬Ă˘â‚¬ĹĄ', ' - ');
    value := replace(value, 'Ă˘â‚¬â€ť', ' - ');
    value := replace(value, 'â€˘', ' - ');
    value := replace(value, 'â€“', ' - ');
    value := replace(value, 'â€”', ' - ');
    value := replace(value, 'â€™', '''');
    value := replace(value, 'â€œ', '"');
    value := replace(value, 'â€ť', '"');
    value := replace(value, 'Â ', ' ');
    value := replace(value, 'Â', '');

    value := replace(value, 'Ă„Ä…Ă‚Â', 'Ł');
    value := replace(value, 'ÄąÂ', 'Ł');
    value := replace(value, 'Äš?', 'Ł');
    value := replace(value, 'Äš', 'Ł');
    value := replace(value, 'Ĺ', 'Ł');
    value := replace(value, 'Ă„Ä…ÄąË‡', 'Ś');
    value := replace(value, 'ÄąĹˇ', 'Ś');
    value := replace(value, 'Ĺš', 'Ś');

    value := replace(value, 'Ă„â€šÄąâ€š', 'ó');
    value := replace(value, 'Ä‚â€šÄąâ€š', 'ó');
    value := replace(value, 'Ä‚Ĺ‚', 'ó');
    value := replace(value, 'Ăł', 'ó');
    value := replace(value, 'Ă„Ä…Ă˘â‚¬Ĺˇ', 'ł');
    value := replace(value, 'Äąâ€š', 'ł');
    value := replace(value, 'Ĺ‚', 'ł');

    value := replace(value, 'Ä‚â€žĂ˘â‚¬Â¦', 'ą');
    value := replace(value, 'Ă„â€¦', 'ą');
    value := replace(value, 'Ä…', 'ą');
    value := replace(value, 'Ä‚â€žĂ˘â€žË', 'ę');
    value := replace(value, 'Ă„â„˘', 'ę');
    value := replace(value, 'Ä™', 'ę');
    value := replace(value, 'Ä‚â€žĂ˘â‚¬Ë‡', 'ć');
    value := replace(value, 'Ă„â€ˇ', 'ć');
    value := replace(value, 'Ä‡', 'ć');
    value := replace(value, 'Ă„Ä…Ă˘â‚¬Ĺľ', 'ń');
    value := replace(value, 'Äąâ€ž', 'ń');
    value := replace(value, 'Ĺ„', 'ń');
    value := replace(value, 'Ă„Ä…Ă˘â‚¬Ĺź', 'ś');
    value := replace(value, 'Äąâ€ş', 'ś');
    value := replace(value, 'Ĺ›', 'ś');
    value := replace(value, 'Ă„Ä…ÄąĹş', 'ź');
    value := replace(value, 'ÄąĹź', 'ź');
    value := replace(value, 'Ĺş', 'ź');
    value := replace(value, 'Ă„Ä…Ă„Ëť', 'ż');
    value := replace(value, 'ÄąÄ˝', 'ż');
    value := replace(value, 'ĹĽ', 'ż');
    value := replace(value, 'Ă„Ä…Ă„Â»', 'Ż');
    value := replace(value, 'Ĺ»', 'Ż');

    value := regexp_replace(value, 'Ä[[:alpha:]]' || chr(65533), 'Ł', 'g');
    value := regexp_replace(value, 'Ä[[:alpha:]]\?', 'Ł', 'g');
    value := regexp_replace(value, 'Ä.{1,3}up', 'Łup', 'g');
    value := regexp_replace(value, 'Ä.{1,3}owca', 'Łowca', 'g');
    value := replace(value, 'Ł?', 'Ł');
    value := replace(value, chr(65533), '');
    RETURN regexp_replace(value, '\s{2,}', ' ', 'g');
END;
$$;

UPDATE generator_pools
SET payload_json = fix_generator_encoding_artifacts(payload_json::text)::jsonb
WHERE payload_json::text ~ '(Ä|Ă|Ĺ|â|Â)';

UPDATE generator_definitions
SET name = fix_generator_encoding_artifacts(name),
    description = fix_generator_encoding_artifacts(description),
    category = fix_generator_encoding_artifacts(category)
WHERE concat_ws(' ', name, description, category) ~ '(Ä|Ă|Ĺ|â|Â)';

UPDATE generator_variants
SET name = fix_generator_encoding_artifacts(name),
    description = fix_generator_encoding_artifacts(description)
WHERE concat_ws(' ', name, description) ~ '(Ä|Ă|Ĺ|â|Â)';

UPDATE generator_field_definitions
SET label = fix_generator_encoding_artifacts(label),
    default_value = fix_generator_encoding_artifacts(default_value),
    options_json = fix_generator_encoding_artifacts(options_json::text)::jsonb
WHERE concat_ws(' ', label, default_value, options_json) ~ '(Ä|Ă|Ĺ|â|Â)';

UPDATE generator_results
SET title = fix_generator_encoding_artifacts(title),
    summary = fix_generator_encoding_artifacts(summary),
    output_json = fix_generator_encoding_artifacts(output_json::text)::jsonb
WHERE concat_ws(' ', title, summary, output_json) ~ '(Ä|Ă|Ĺ|â|Â)';

UPDATE rules_pages
SET title = fix_generator_encoding_artifacts(title),
    content = fix_generator_encoding_artifacts(content)
WHERE concat_ws(' ', title, content) ~ '(Ä|Ă|Ĺ|â|Â)';

UPDATE glossary_terms
SET term_pl = fix_generator_encoding_artifacts(term_pl),
    definition = fix_generator_encoding_artifacts(definition)
WHERE concat_ws(' ', term_pl, definition) ~ '(Ä|Ă|Ĺ|â|Â)';

DROP FUNCTION fix_generator_encoding_artifacts(text);
