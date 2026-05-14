-- Tone/climate is no longer exposed in MVP generator forms.

DELETE FROM generator_field_definitions
WHERE field_key = 'tone'
  AND variant_id IN (
    SELECT gv.id
    FROM generator_variants gv
    JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
    WHERE gd.code IN ('npc','location','faction','hook','weather')
  );
