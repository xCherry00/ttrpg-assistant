-- V3__monsters.sql
-- Tabela potworów + seed (30 klasyków fantasy / D&D-like)

CREATE TABLE IF NOT EXISTS monsters (
    id BIGSERIAL PRIMARY KEY,

    name_pl VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,

    initiative_mod INT NOT NULL,
    armor_class INT NOT NULL,
    hit_points INT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- SEED: 30 POTWORÓW FANTASY
-- =========================

INSERT INTO monsters (name_pl, name_en, initiative_mod, armor_class, hit_points) VALUES

-- HUMANOIDY
('Goblin', 'Goblin', 2, 15, 7),
('Ork', 'Orc', 1, 13, 15),
('Hobgoblin', 'Hobgoblin', 1, 18, 11),
('Kobold', 'Kobold', 2, 12, 5),
('Bandyta', 'Bandit', 1, 12, 11),
('Kultysta', 'Cultist', 0, 12, 9),

-- BESTIE
('Wilk', 'Wolf', 2, 13, 11),
('Niedźwiedź', 'Bear', 0, 11, 34),
('Pająk olbrzymi', 'Giant Spider', 3, 14, 26),
('Szczur olbrzymi', 'Giant Rat', 2, 12, 7),

-- NIEUMARLI
('Szkielet', 'Skeleton', 2, 13, 13),
('Zombie', 'Zombie', -2, 8, 22),
('Upiór', 'Ghoul', 2, 12, 22),
('Widmo', 'Wraith', 2, 13, 67),

-- POTWORY / MONSTROSITIES
('Ogr', 'Ogre', -1, 11, 59),
('Troll', 'Troll', 1, 15, 84),
('Minotaur', 'Minotaur', 0, 14, 76),
('Mantykora', 'Manticore', 2, 14, 68),

-- KONSTRUKTY / MAGIA
('Golem gliniany', 'Clay Golem', -1, 14, 133),
('Ożywiona zbroja', 'Animated Armor', 0, 18, 33),

-- DIABŁY / DEMONY
('Imp', 'Imp', 3, 13, 10),
('Diablę', 'Quasit', 3, 13, 7),

-- SMOKI / GADY
('Smoczy Wyrmling', 'Red Dragon Wyrmling', 0, 17, 75),
('Drake', 'Drake', 1, 14, 52),

-- INNE
('Ent', 'Treant', -1, 16, 138),
('Gargulec', 'Gargoyle', 2, 15, 52),
('Harpia', 'Harpy', 1, 11, 38),
('Meduza', 'Medusa', 2, 15, 127),
('Krakenowy pomiot', 'Kraken Spawn', 1, 14, 45);
