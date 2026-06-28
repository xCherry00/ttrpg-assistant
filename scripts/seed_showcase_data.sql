DO $$
DECLARE
    marta_id bigint;
    arek_id bigint;
    kasia_id bigint;
    tomek_id bigint;
    ola_id bigint;
    varella_id bigint;
    arkham_id bigint;
    towers_id bigint;
    session_varella_live_id bigint;
    session_varella_next_id bigint;
    session_arkham_next_id bigint;
    char_lyra_id bigint;
    char_borin_id bigint;
    char_nadia_id bigint;
    char_helena_id bigint;
    char_mikolaj_id bigint;
    char_sana_id bigint;
    conv_one_id bigint;
    conv_two_id bigint;
    msg_id bigint;
BEGIN
    SELECT id INTO marta_id FROM users WHERE email = 'marta.gm@demo.ttrpg.local';
    SELECT id INTO arek_id FROM users WHERE email = 'arek.gracz@demo.ttrpg.local';
    SELECT id INTO kasia_id FROM users WHERE email = 'kasia.gracz@demo.ttrpg.local';
    SELECT id INTO tomek_id FROM users WHERE email = 'tomek.gm@demo.ttrpg.local';
    SELECT id INTO ola_id FROM users WHERE email = 'ola.gracz@demo.ttrpg.local';

    IF marta_id IS NULL OR arek_id IS NULL OR kasia_id IS NULL OR tomek_id IS NULL OR ola_id IS NULL THEN
        RAISE EXCEPTION 'Brakuje kont demo. Najpierw zarejestruj konta przez /api/auth/register.';
    END IF;

    UPDATE users SET
        display_name = 'KrukMistrzyni',
        username = 'krukmistrzyni',
        tag_code = '1001',
        role = 'PLAYER',
        is_mg = true,
        bio = 'Mistrzyni gry. Prowadzi mroczne fantasy, lubi mapy, tajemnice i dobrze opisane konsekwencje wyborow.',
        favorite_system = 'D&D 5e',
        profile_visibility = 'PUBLIC',
        friends_visibility = 'PUBLIC',
        activity_visibility = 'PUBLIC',
        chat_nick_color = '#0f766e',
        avatar_url = '/assets/avatars/K1.png',
        profile_banner_url = '/assets/placeholder/Baner.png',
        last_active_at = now() - interval '4 minutes'
    WHERE id = marta_id;

    UPDATE users SET
        display_name = 'BardNaKrycie',
        username = 'bard-na-krycie',
        tag_code = '2184',
        role = 'PLAYER',
        is_mg = false,
        bio = 'Gracz od bardow, ryzykownych planow i rzutow wykonywanych zawsze o jeden za pozno.',
        favorite_system = 'D&D 5e',
        profile_visibility = 'PUBLIC',
        friends_visibility = 'FRIENDS_ONLY',
        activity_visibility = 'PUBLIC',
        chat_nick_color = '#b45309',
        avatar_url = '/assets/avatars/M1.png',
        profile_banner_url = '/assets/placeholder/Baner.png',
        last_active_at = now() - interval '18 minutes'
    WHERE id = arek_id;

    UPDATE users SET
        display_name = 'ArchiwistkaK20',
        username = 'archiwistka-k20',
        tag_code = '3317',
        role = 'PLAYER',
        is_mg = false,
        bio = 'Notuje kazda poszlake. Specjalizacja: uzdrowicielki, badaczki i postacie z sekretem.',
        favorite_system = 'Call of Cthulhu 7e',
        profile_visibility = 'PUBLIC',
        friends_visibility = 'PUBLIC',
        activity_visibility = 'PUBLIC',
        chat_nick_color = '#7c3aed',
        avatar_url = '/assets/avatars/K2.png',
        profile_banner_url = '/assets/placeholder/Baner.png',
        last_active_at = now() - interval '1 hour'
    WHERE id = kasia_id;

    UPDATE users SET
        display_name = 'KeeperZero',
        username = 'keeper-zero',
        tag_code = '4702',
        role = 'PLAYER',
        is_mg = true,
        bio = 'Prowadzi sledztwa, archiwa i kampanie, w ktorych kalendarz jest grozniejszy od potworow.',
        favorite_system = 'Call of Cthulhu 7e',
        profile_visibility = 'PUBLIC',
        friends_visibility = 'FRIENDS_ONLY',
        activity_visibility = 'PUBLIC',
        chat_nick_color = '#2563eb',
        avatar_url = '/assets/avatars/M2.png',
        profile_banner_url = '/assets/placeholder/Baner.png',
        last_active_at = now() - interval '37 minutes'
    WHERE id = tomek_id;

    UPDATE users SET
        display_name = 'SzybkaSana',
        username = 'szybka-sana',
        tag_code = '9088',
        role = 'PLAYER',
        is_mg = false,
        bio = 'Nowa w ekipie, ale zawsze przygotowana. Lubi zwiad, alchemie i publiczne kampanie.',
        favorite_system = 'D&D 5e',
        profile_visibility = 'PUBLIC',
        friends_visibility = 'PUBLIC',
        activity_visibility = 'PUBLIC',
        chat_nick_color = '#be123c',
        avatar_url = '/assets/placeholder/Avatar.png',
        profile_banner_url = '/assets/placeholder/Baner.png',
        last_active_at = now() - interval '2 days'
    WHERE id = ola_id;

    INSERT INTO campaigns (owner_user_id, title, system_code, description_md, status, join_code, cover_image_url, banner_image_url, visibility, player_limit, created_at, updated_at)
    VALUES
        (marta_id, 'Cienie nad Varella', 'dnd5e', 'Otwarte fantasy o miescie na granicy puszczy, gdzie znikaja karawany, a stara wieza znowu swieci po zmroku.', 'active', 'VARELLA', '/assets/campaign-icons/D1.png', '/assets/campaign-banners/Dn1.png', 'PUBLIC', 5, now() - interval '42 days', now() - interval '8 minutes')
    RETURNING id INTO varella_id;

    INSERT INTO campaigns (owner_user_id, title, system_code, description_md, status, join_code, cover_image_url, banner_image_url, visibility, player_limit, created_at, updated_at)
    VALUES
        (tomek_id, 'Akta Arkham: Zimny Deszcz', 'coc7e', 'Kameralne sledztwo o starym hotelu, zaginionym profesorze i aktach, ktorych nikt nie powinien otwierac.', 'active', 'ARKHAM7', '/assets/campaign-icons/Z1.png', '/assets/campaign-banners/Ze1.png', 'PRIVATE', 4, now() - interval '25 days', now() - interval '2 hours')
    RETURNING id INTO arkham_id;

    INSERT INTO campaigns (owner_user_id, title, system_code, description_md, status, join_code, cover_image_url, banner_image_url, visibility, player_limit, created_at, updated_at)
    VALUES
        (marta_id, 'Szlak Popielnych Wiez', 'dnd5e', 'Publiczna kampania eksploracyjna. Druzyne czeka wyprawa przez ruiny, mosty z czarnego kamienia i frakcje walczace o relikty.', 'active', 'WIEZE26', '/assets/campaign-icons/D2.png', '/assets/campaign-banners/Dn2.png', 'PUBLIC', 6, now() - interval '9 days', now() - interval '1 day')
    RETURNING id INTO towers_id;

    INSERT INTO campaign_members (campaign_id, user_id, role, created_at) VALUES
        (varella_id, marta_id, 'gm', now() - interval '42 days'),
        (varella_id, arek_id, 'player', now() - interval '38 days'),
        (varella_id, kasia_id, 'player', now() - interval '35 days'),
        (varella_id, ola_id, 'player', now() - interval '6 days'),
        (arkham_id, tomek_id, 'gm', now() - interval '25 days'),
        (arkham_id, kasia_id, 'player', now() - interval '22 days'),
        (arkham_id, arek_id, 'player', now() - interval '15 days'),
        (towers_id, marta_id, 'gm', now() - interval '9 days'),
        (towers_id, ola_id, 'player', now() - interval '8 days');

    INSERT INTO user_campaign_favorites (user_id, campaign_id, created_at) VALUES
        (arek_id, varella_id, now() - interval '30 days'),
        (kasia_id, arkham_id, now() - interval '20 days'),
        (ola_id, towers_id, now() - interval '7 days'),
        (tomek_id, varella_id, now() - interval '2 days');

    INSERT INTO campaign_sessions (campaign_id, title, description_md, status, scheduled_for, started_at, created_by_user_id, created_at, updated_at)
    VALUES
        (varella_id, 'Sesja 5: Swiatlo w starej wiezy', 'Druzyna weszla do podziemi wiezy i odnalazla zamkniete przejscie z runami.', 'IN_PROGRESS', now() - interval '1 hour', now() - interval '48 minutes', marta_id, now() - interval '4 days', now() - interval '5 minutes')
    RETURNING id INTO session_varella_live_id;

    INSERT INTO campaign_sessions (campaign_id, title, description_md, status, scheduled_for, created_by_user_id, created_at, updated_at)
    VALUES
        (varella_id, 'Sesja 6: Most nad Czarna Woda', 'Planowana wyprawa do ruin przy trakcie kupieckim.', 'PLANNED', now() + interval '3 days' + interval '2 hours', marta_id, now() - interval '2 days', now() - interval '2 days')
    RETURNING id INTO session_varella_next_id;

    INSERT INTO campaign_sessions (campaign_id, title, description_md, status, scheduled_for, started_at, finished_at, created_by_user_id, created_at, updated_at)
    VALUES
        (varella_id, 'Sesja 4: Kupcy bez cieni', 'Gracze odkryli, ze trzecia karawana nigdy nie dotarla do bramy miasta.', 'FINISHED', now() - interval '7 days', now() - interval '7 days', now() - interval '7 days' + interval '3 hours', marta_id, now() - interval '9 days', now() - interval '7 days');

    INSERT INTO campaign_sessions (campaign_id, title, description_md, status, scheduled_for, created_by_user_id, created_at, updated_at)
    VALUES
        (arkham_id, 'Sprawa hotelu Gilman', 'Pierwsze przesluchania, deszcz i archiwum policyjne.', 'PLANNED', now() + interval '5 days' + interval '1 hour', tomek_id, now() - interval '5 days', now() - interval '5 days')
    RETURNING id INTO session_arkham_next_id;

    INSERT INTO session_live_state (campaign_id, session_id, scene_title, scene_image_url, scene_description, updated_by_user_id, created_at, updated_at)
    VALUES
        (varella_id, session_varella_live_id, 'Komnata z zielonym ogniem', '/assets/campaign-banners/Dn3.png', 'Na srodku sali plonie bezdymny ogien. Cienie postaci ukladaja sie w kierunku zamknietych drzwi.', marta_id, now() - interval '48 minutes', now() - interval '6 minutes');

    INSERT INTO campaign_session_attendance (campaign_id, session_id, user_id, status, note, created_at, updated_at) VALUES
        (varella_id, session_varella_next_id, marta_id, 'AVAILABLE', 'Prowadze, start punktualnie.', now() - interval '2 days', now() - interval '2 days'),
        (varella_id, session_varella_next_id, arek_id, 'AVAILABLE', 'Bede 10 minut przed czasem.', now() - interval '1 day', now() - interval '1 day'),
        (varella_id, session_varella_next_id, kasia_id, 'MAYBE', 'Zalezy od pracy, dam znac w dniu sesji.', now() - interval '12 hours', now() - interval '12 hours'),
        (varella_id, session_varella_next_id, ola_id, 'UNAVAILABLE', 'Wyjazd rodzinny.', now() - interval '10 hours', now() - interval '10 hours'),
        (arkham_id, session_arkham_next_id, tomek_id, 'AVAILABLE', 'Przygotowane handouty.', now() - interval '5 days', now() - interval '5 days'),
        (arkham_id, session_arkham_next_id, kasia_id, 'AVAILABLE', 'Bede z notatkami.', now() - interval '1 day', now() - interval '1 day');

    INSERT INTO player_characters (owner_user_id, system_code, name, status, portrait_url, race_name, class_name, background_name, alignment, level, experience_points, ability_mode, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, temp_hp, armor_class, initiative_bonus, speed, proficiency_bonus, hit_dice, skill_notes, saving_throw_notes, equipment_notes, feature_notes, personality_notes, private_notes, sheet_json)
    VALUES
        (arek_id, 'dnd5e', 'Lyra Zlotolistna', 'ACTIVE', '/assets/character-avatars/PD1.png', 'Elf', 'Bard', 'Wloczega', 'Chaotic Good', 5, 6500, 'MANUAL', 8, 16, 13, 12, 10, 18, 33, 28, 0, 15, 3, 30, 3, '5d8', 'Perswazja +7, Wystepy +7, Skradanie +6', 'Charyzma i zrecznosc pod kontrola.', 'Lutnia, rapier, skorzana zbroja, notes z plotkami.', 'Inspiracja bardowska, Jack of All Trades, College of Lore.', 'Zawsze usmiechnieta, gdy sytuacja jest najgorsza.', 'Podejrzewa, ze pieśń o Varelli opisuje prawdziwe miejsce.', '{"system":"dnd5e","notes":{"goal":"Odnalezc zaginiona mentorke."},"spells":["healing-word","dissonant-whispers","faerie-fire"]}'::jsonb)
    RETURNING id INTO char_lyra_id;

    INSERT INTO player_characters (owner_user_id, system_code, name, status, portrait_url, race_name, class_name, background_name, alignment, level, experience_points, ability_mode, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, temp_hp, armor_class, initiative_bonus, speed, proficiency_bonus, hit_dice, skill_notes, equipment_notes, feature_notes, personality_notes, private_notes, sheet_json)
    VALUES
        (kasia_id, 'dnd5e', 'Borin z Zelaznej Bramy', 'ACTIVE', '/assets/character-avatars/PD2.png', 'Krasnolud', 'Kleryk', 'Akolita', 'Lawful Good', 5, 6500, 'MANUAL', 15, 10, 16, 11, 17, 12, 42, 42, 4, 18, 0, 25, 3, '5d8', 'Medycyna +6, Religia +4, Insight +6', 'Kolczuga, tarcza, symbol Moradina, mikstura leczenia.', 'Channel Divinity, domena zycia, leczenie ran.', 'Milczy dlugo, ale gdy juz cos powie, zwykle ma racje.', 'Nie ufa plomieniom w starej wiezy.', '{"system":"dnd5e","preparedSpells":["bless","lesser-restoration","spiritual-weapon"]}'::jsonb)
    RETURNING id INTO char_borin_id;

    INSERT INTO player_characters (owner_user_id, system_code, name, status, portrait_url, race_name, class_name, background_name, alignment, level, experience_points, ability_mode, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, temp_hp, armor_class, initiative_bonus, speed, proficiency_bonus, hit_dice, skill_notes, equipment_notes, feature_notes, personality_notes, private_notes, sheet_json)
    VALUES
        (ola_id, 'dnd5e', 'Sana Quickstep', 'ACTIVE', '/assets/character-avatars/PD3.png', 'Niziolek', 'Rogue', 'Zlodziejka', 'Neutral Good', 3, 2700, 'MANUAL', 9, 18, 12, 14, 13, 11, 24, 19, 0, 16, 4, 25, 2, '3d8', 'Akrobatyka +6, Sleight of Hand +6, Percepcja +5', 'Sztylety, krotki luk, zestaw zlodziejski, lina 15m.', 'Sneak Attack, Cunning Action, Thief.', 'Wszystko traktuje jak probe odwagi.', 'Chce zdobyc zaufanie druzyny.', '{"system":"dnd5e","equipment":["thieves-tools","shortbow","dagger"]}'::jsonb)
    RETURNING id INTO char_sana_id;

    INSERT INTO player_characters (owner_user_id, system_code, name, status, portrait_url, race_name, class_name, background_name, alignment, level, experience_points, ability_mode, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, temp_hp, armor_class, initiative_bonus, speed, proficiency_bonus, hit_dice, skill_notes, equipment_notes, feature_notes, personality_notes, private_notes, sheet_json)
    VALUES
        (kasia_id, 'coc7e', 'Helena Ward', 'ACTIVE', '/assets/character-avatars/PZ1.png', 'Czlowiek', 'Bibliotekarka', 'Uniwersytet Miskatonic', 'Neutral', 1, 0, 'MANUAL', 45, 55, 50, 80, 70, 60, 12, 12, 0, 0, 0, 30, 0, '', 'Library Use 80, Spot Hidden 55, Psychology 60', 'Latarka, notatnik, aparat fotograficzny, list polecajacy.', 'Zna archiwa Arkham i lacine akademicka.', 'Uprzejma, dopoki ktos nie niszczy ksiazek.', 'Wie, ze profesor Marsh ukrywal drugi dziennik.', '{"system":"coc7e","occupation":"Librarian","sanity":62,"luck":48}'::jsonb)
    RETURNING id INTO char_helena_id;

    INSERT INTO player_characters (owner_user_id, system_code, name, status, portrait_url, race_name, class_name, background_name, alignment, level, experience_points, ability_mode, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, temp_hp, armor_class, initiative_bonus, speed, proficiency_bonus, hit_dice, skill_notes, equipment_notes, feature_notes, personality_notes, private_notes, sheet_json)
    VALUES
        (arek_id, 'coc7e', 'Mikolaj Reed', 'ACTIVE', '/assets/character-avatars/PZ2.png', 'Czlowiek', 'Reporter', 'Gazeta Arkham Advertiser', 'Neutral', 1, 0, 'MANUAL', 50, 65, 55, 70, 50, 75, 13, 11, 0, 0, 0, 30, 0, '', 'Fast Talk 70, Photography 60, Credit Rating 45', 'Aparat, notes prasowy, zapasowe filmy, pistolet kieszonkowy.', 'Kontakty w redakcji i policji.', 'Zadaje jedno pytanie za duzo.', 'Ma dowody, ktorych nie pokazal reszcie.', '{"system":"coc7e","occupation":"Reporter","sanity":55,"luck":61}'::jsonb)
    RETURNING id INTO char_mikolaj_id;

    INSERT INTO player_characters (owner_user_id, system_code, name, status, portrait_url, race_name, class_name, background_name, alignment, level, experience_points, ability_mode, strength, dexterity, constitution, intelligence, wisdom, charisma, max_hp, current_hp, temp_hp, armor_class, initiative_bonus, speed, proficiency_bonus, hit_dice, skill_notes, equipment_notes, feature_notes, personality_notes, private_notes, sheet_json)
    VALUES
        (marta_id, 'dnd5e', 'Nadia Thorn', 'ACTIVE', '/assets/character-avatars/PD4.png', 'Czlowiek', 'Ranger', 'Przewodniczka', 'Neutral Good', 4, 4200, 'MANUAL', 12, 17, 14, 11, 15, 10, 36, 36, 0, 15, 3, 30, 2, '4d10', 'Survival +6, Nature +3, Perception +6', 'Luk dlugi, mapa ruin, zestaw tropiciela.', 'Favored Enemy, Natural Explorer.', 'Nie lubi miast, ale zna kazdy trakt.', 'NPC do pokazowej publicznej kampanii.', '{"system":"dnd5e","role":"showcase-npc"}'::jsonb)
    RETURNING id INTO char_nadia_id;

    INSERT INTO campaign_characters (campaign_id, character_id, user_id, role, is_active, assigned_at) VALUES
        (varella_id, char_lyra_id, arek_id, 'PLAYER_CHARACTER', true, now() - interval '38 days'),
        (varella_id, char_borin_id, kasia_id, 'PLAYER_CHARACTER', true, now() - interval '35 days'),
        (varella_id, char_sana_id, ola_id, 'PLAYER_CHARACTER', true, now() - interval '6 days'),
        (arkham_id, char_helena_id, kasia_id, 'PLAYER_CHARACTER', true, now() - interval '22 days'),
        (arkham_id, char_mikolaj_id, arek_id, 'PLAYER_CHARACTER', true, now() - interval '15 days'),
        (towers_id, char_nadia_id, marta_id, 'NPC', true, now() - interval '8 days'),
        (towers_id, char_sana_id, ola_id, 'PLAYER_CHARACTER', true, now() - interval '7 days');

    INSERT INTO friendships (user_id, friend_user_id, created_at) VALUES
        (marta_id, arek_id, now() - interval '80 days'),
        (arek_id, marta_id, now() - interval '80 days'),
        (marta_id, kasia_id, now() - interval '75 days'),
        (kasia_id, marta_id, now() - interval '75 days'),
        (arek_id, kasia_id, now() - interval '55 days'),
        (kasia_id, arek_id, now() - interval '55 days'),
        (tomek_id, kasia_id, now() - interval '30 days'),
        (kasia_id, tomek_id, now() - interval '30 days'),
        (ola_id, marta_id, now() - interval '8 days'),
        (marta_id, ola_id, now() - interval '8 days');

    INSERT INTO friend_requests (sender_user_id, receiver_user_id, status, created_at, responded_at) VALUES
        (ola_id, arek_id, 'PENDING', now() - interval '1 day', null),
        (tomek_id, marta_id, 'ACCEPTED', now() - interval '10 days', now() - interval '9 days'),
        (marta_id, tomek_id, 'ACCEPTED', now() - interval '10 days', now() - interval '9 days');

    INSERT INTO dm_conversations (type, direct_key, title, created_by_user_id, created_at, updated_at)
    VALUES ('DIRECT', LEAST(arek_id, kasia_id)::text || ':' || GREATEST(arek_id, kasia_id)::text, '', arek_id, now() - interval '14 days', now() - interval '20 minutes')
    RETURNING id INTO conv_one_id;

    INSERT INTO dm_conversation_members (conversation_id, user_id, status, muted, joined_at, last_read_at) VALUES
        (conv_one_id, arek_id, 'ACTIVE', false, now() - interval '14 days', now() - interval '19 minutes'),
        (conv_one_id, kasia_id, 'ACTIVE', false, now() - interval '14 days', now() - interval '3 hours');

    INSERT INTO dm_messages (conversation_id, sender_user_id, content, created_at) VALUES
        (conv_one_id, arek_id, 'Masz jeszcze notatki o symbolu z wiezy?', now() - interval '3 hours'),
        (conv_one_id, kasia_id, 'Tak, wrzucilam je do notatek. To nie byl znak kultu, tylko herb starej kompanii.', now() - interval '2 hours'),
        (conv_one_id, arek_id, 'Idealnie. Lyra zrobi z tego ballade, zanim nas zabije.', now() - interval '20 minutes');

    UPDATE dm_conversations
    SET last_message_preview = 'Idealnie. Lyra zrobi z tego ballade, zanim nas zabije.',
        last_message_sender_user_id = arek_id,
        last_message_at = now() - interval '20 minutes',
        updated_at = now() - interval '20 minutes'
    WHERE id = conv_one_id;

    INSERT INTO dm_conversations (type, direct_key, title, created_by_user_id, created_at, updated_at)
    VALUES ('DIRECT', LEAST(marta_id, ola_id)::text || ':' || GREATEST(marta_id, ola_id)::text, '', marta_id, now() - interval '6 days', now() - interval '2 hours')
    RETURNING id INTO conv_two_id;

    INSERT INTO dm_conversation_members (conversation_id, user_id, status, muted, joined_at, last_read_at) VALUES
        (conv_two_id, marta_id, 'ACTIVE', false, now() - interval '6 days', now() - interval '2 hours'),
        (conv_two_id, ola_id, 'ACTIVE', false, now() - interval '6 days', now() - interval '1 day');

    INSERT INTO dm_messages (conversation_id, sender_user_id, content, created_at) VALUES
        (conv_two_id, marta_id, 'Witaj w kampanii. Jesli chcesz, Sana moze wejsc w nastepnej scenie jako zwiadowczyni z traktu.', now() - interval '6 days'),
        (conv_two_id, ola_id, 'Super, pasuje. Dopisalam jej relacje z kupcami i powod, dla ktorego szuka wiezy.', now() - interval '2 hours');

    UPDATE dm_conversations
    SET last_message_preview = 'Super, pasuje. Dopisalam jej relacje z kupcami i powod, dla ktorego szuka wiezy.',
        last_message_sender_user_id = ola_id,
        last_message_at = now() - interval '2 hours',
        updated_at = now() - interval '2 hours'
    WHERE id = conv_two_id;

    INSERT INTO campaign_notifications (campaign_id, user_id, type, message, read_at, created_at) VALUES
        (varella_id, arek_id, 'session_started', 'Sesja "Swiatlo w starej wiezy" wlasnie wystartowala.', null, now() - interval '45 minutes'),
        (varella_id, kasia_id, 'session_started', 'Sesja "Swiatlo w starej wiezy" wlasnie wystartowala.', now() - interval '30 minutes', now() - interval '45 minutes'),
        (varella_id, ola_id, 'member_joined', 'SzybkaSana dolaczyla do kampanii.', null, now() - interval '6 days'),
        (arkham_id, kasia_id, 'session_planned', 'Zaplanowano sesje "Sprawa hotelu Gilman".', null, now() - interval '5 days'),
        (towers_id, ola_id, 'campaign_invite', 'KrukMistrzyni dodala Cie do kampanii "Szlak Popielnych Wiez".', now() - interval '7 days', now() - interval '8 days');

    INSERT INTO user_notes (user_id, title, type, content, campaign_id, character_id, created_at, updated_at) VALUES
        (marta_id, 'Sekrety Varelli', 'LORE', 'Zielony ogien reaguje na nazwisko rodu Valmor. Warto ujawnic to dopiero przy drugim poziomie podziemi.', varella_id, null, now() - interval '20 days', now() - interval '3 hours'),
        (arek_id, 'Pomysly Lyry', 'QUEST', 'Zapytac karczmarke o piesn "Trzy cienie na trakcie". Moze zna brakujaca zwrotke.', varella_id, char_lyra_id, now() - interval '12 days', now() - interval '1 day'),
        (kasia_id, 'Akta profesora Marsha', 'NPC', 'Profesor korespondowal z E. Pickmanem. Sprawdzic archiwum gazety z 1919 roku.', arkham_id, char_helena_id, now() - interval '4 days', now() - interval '7 hours'),
        (ola_id, 'Sana - wejscie do druzyny', 'OTHER', 'Sana zna haslo kupcow: "Jesion pamieta droge". Uzyc przy pierwszej rozmowie z karawana.', varella_id, char_sana_id, now() - interval '6 days', now() - interval '2 days');

    INSERT INTO generator_results (user_id, campaign_id, generator_code, variant_code, input_json, output_json, title, summary, created_at) VALUES
        (marta_id, varella_id, 'npc', 'dnd5e-tavern-contact', '{"tone":"mroczny","role":"informator"}'::jsonb, '{"name":"Runa od Mostu","hook":"Zna droge pod stara wieze, ale boi sie zielonego ognia."}'::jsonb, 'Runa od Mostu', 'Kontakt karczemny dla Varelli.', now() - interval '2 days'),
        (tomek_id, arkham_id, 'clue', 'coc7e-archive', '{"place":"hotel","era":"1920"}'::jsonb, '{"title":"Paragon z pralni","detail":"Na odwrocie zapisano numer pokoju, ktory oficjalnie nie istnieje."}'::jsonb, 'Paragon z pralni', 'Poszlaka do sledztwa w Arkham.', now() - interval '1 day');

END $$;
