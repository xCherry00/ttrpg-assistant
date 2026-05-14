-- Replace non-SRD item names in the local treasure seed with generic equivalents.
UPDATE generator_pools
SET payload_json = jsonb_set(
        payload_json,
        '{magicItems,common}',
        '["Potion of Healing","Spell Scroll (cantrip)","Zaklęty miecz z runą świetlną","Płaszcz iluzji powiewu","Driftglobe"]'::jsonb
    ),
    updated_at = now()
WHERE generator_type = 'loot'
  AND system_code = 'dnd'
  AND subtype = 'default';
