UPDATE generator_definitions
SET is_active = false,
    updated_at = now()
WHERE code = 'time_of_day';
