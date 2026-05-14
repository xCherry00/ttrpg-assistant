-- Generator taxonomy cleanup after narrowing system-specific variants.
--
-- Rules:
-- 1. generator code is a concrete table tool, e.g. tavern or shop_fantasy.
-- 2. type_code is only a catalog filter, e.g. location, npc, item, clue.
-- 3. system-specific variants stay only where output can include mechanics.

UPDATE generator_definitions
SET type_code = 'location',
    system_tags = '["system_agnostic","dnd","dnd5e","pf2e","wfrp4e","morkborg"]'::jsonb,
    updated_at = now()
WHERE code = 'shop_fantasy';

UPDATE generator_definitions
SET type_code = 'clue',
    updated_at = now()
WHERE code = 'clue';

UPDATE generator_definitions
SET is_active = false,
    updated_at = now()
WHERE code = 'horror_document';

UPDATE generator_variants gv
SET is_active = false
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gd.code = 'horror_document';

-- Descriptive generators expose setting quick variants only. Their system_tags
-- mean compatibility, not a separate mechanical variant.
UPDATE generator_definitions
SET system_tags = '["system_agnostic","dnd","dnd5e","pf2e","wfrp4e","morkborg"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'tavern',
  'shop_fantasy',
  'settlement_fantasy',
  'district_fantasy',
  'dungeon_concept',
  'dungeon_room',
  'quest_fantasy',
  'faction_fantasy'
);

UPDATE generator_definitions
SET system_tags = '["system_agnostic","coc7e","kult","liminal_horror"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'suspect',
  'witness',
  'victim',
  'clue',
  'investigation_location',
  'cult_horror',
  'omen',
  'horror_escalation'
);

UPDATE generator_definitions
SET system_tags = '["system_agnostic","walking_dead"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'survivor_group',
  'shelter',
  'supply_run',
  'supplies',
  'postapo_location',
  'postapo_conflict',
  'moral_dilemma',
  'postapo_event',
  'vehicle_wreck'
);

UPDATE generator_definitions
SET system_tags = '["system_agnostic","alien","mothership","cyberpunk","starfinder","traveller","coriolis"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'planet',
  'space_station',
  'starship',
  'colony',
  'corporation',
  'scifi_mission',
  'system_failure',
  'ship_threat'
);

-- Mechanic-capable generators keep broader compatibility tags.
UPDATE generator_definitions
SET system_tags = '["system_agnostic","dnd","dnd5e","pf2e","wfrp4e","morkborg"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'npc_fantasy',
  'encounter_fantasy',
  'trap_fantasy',
  'monster_variant',
  'loot_fantasy',
  'magic_item'
);

UPDATE generator_definitions
SET system_tags = '["system_agnostic","coc7e","kult","liminal_horror"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'npc_horror',
  'horror_creature',
  'artifact_horror',
  'ritual'
);

UPDATE generator_definitions
SET system_tags = '["system_agnostic","walking_dead"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'survivor',
  'zombie_variant',
  'horde',
  'disease_contamination'
);

UPDATE generator_definitions
SET system_tags = '["system_agnostic","alien","mothership","cyberpunk","starfinder","traveller","coriolis"]'::jsonb,
    updated_at = now()
WHERE code IN (
  'npc_scifi',
  'anomaly',
  'alien_organism',
  'technology',
  'cyberware'
);

UPDATE generator_variants gv
SET system_code = 'system_agnostic'
FROM generator_definitions gd
WHERE gd.id = gv.generator_definition_id
  AND gv.variant_code IN ('fantasy.quick', 'horror.quick', 'postapo.quick', 'scifi.quick');
