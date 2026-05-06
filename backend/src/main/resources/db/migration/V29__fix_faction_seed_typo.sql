UPDATE generator_pools
SET payload_json = replace(payload_json::text, 'LatarnI', 'Latarni')::jsonb,
    updated_at = now()
WHERE generator_type = 'faction'
  AND system_code = 'any'
  AND subtype = 'general.quick';
