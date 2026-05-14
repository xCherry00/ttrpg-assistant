-- Add NPC motif, remove Custom names and broaden name/weather pools.

WITH npc_variant AS (
  SELECT gv.id
  FROM generator_variants gv
  JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
  WHERE gd.code = 'npc' AND gv.variant_code = 'general.quick'
)
INSERT INTO generator_field_definitions (variant_id, field_key, label, type, options_json, default_value, required, order_index)
SELECT id, 'motif', 'Motyw', 'SELECT',
       '["Losowy","Dług","Sekret","Rodzina","Ambicja","Zdrada","Relikwia","Zemsta","Przysięga","Ucieczka","Obsesja","Zaginiona osoba","Kontrakt","Dane","Implant","Przetrwanie","Woda","Leki","Reputacja"]'::jsonb,
       'Losowy', false, 25 FROM npc_variant
ON CONFLICT (variant_id, field_key) DO UPDATE
SET label = EXCLUDED.label,
    type = EXCLUDED.type,
    options_json = EXCLUDED.options_json,
    default_value = EXCLUDED.default_value,
    required = EXCLUDED.required,
    order_index = EXCLUDED.order_index;

UPDATE generator_field_definitions gfd
SET options_json = '["Losowa","Słowiańska","Skandynawska","Germańska","Celtycka","Grecka","Łacińska / Rzymska","Arabska","Perska","Azjatycka ogólna","Japońska","Chińska","Koreańska","Indyjska","Afrykańska ogólna","Egipska","Turecka","Mongolska","Hiszpańska","Francuska","Angielska","Włoska"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'name'
  AND gfd.field_key = 'culture';

UPDATE generator_field_definitions gfd
SET options_json = '["Umiarkowany","Tropikalny","Suchy","Zimny","Górski","Nadmorski","Bagienny"]'::jsonb
FROM generator_variants gv
JOIN generator_definitions gd ON gd.id = gv.generator_definition_id
WHERE gfd.variant_id = gv.id
  AND gd.code = 'weather'
  AND gfd.field_key = 'climate';

UPDATE generator_pools
SET payload_json = jsonb_set(
  payload_json::jsonb,
  '{cultures}',
  (payload_json::jsonb -> 'cultures') || '{
    "Słowiańska":{"male":["Mirosław","Borys","Lech","Witold","Radomir","Dobiesław","Jaromir","Kazimierz","Bogdan","Mściwój","Sławomir","Wojciech"],"female":["Mira","Zofia","Lena","Dobrawa","Milena","Radosława","Jagoda","Wanda","Bogna","Kalina","Mirosława","Danuta"],"neutral":["Sasza","Nika","Mika","Milan","Dana","Jaro"],"family":["Kowal","Nowak","Wrona","Zaleski","Dąbek","Lis","Boruta","Kalinowski","Wysocki","Sowa","Brzeziński","Krupa"]},
    "Skandynawska":{"male":["Erik","Sven","Leif","Bjorn","Ivar","Sten","Ragnar","Torsten","Einar","Hakon","Arvid","Nils"],"female":["Astrid","Freja","Ingrid","Sigrid","Liv","Solveig","Runa","Kari","Helga","Anja","Tyra","Signe"],"neutral":["Rune","Ari","Noor","Tove","Eli","Storm"],"family":["Haldorsen","Storm","Eklund","Vik","Svensson","Berg","Lund","Rask","Nord","Skadi","Falk","Holm"]},
    "Arabska":{"male":["Omar","Karim","Samir","Nadir","Jamal","Tariq","Hakim","Zayn","Rashid","Adil","Malik","Yasir"],"female":["Layla","Amira","Nadia","Zahra","Samira","Farah","Mina","Yasmin","Dalia","Rania","Safa","Amina"],"neutral":["Nur","Iman","Safa","Zaki","Rami","Nour"],"family":["al-Hadi","Mansur","Farouk","Rahman","al-Karim","Sabbah","Nasser","Darwish","Qadir","Hassan","Jaber","Fahmi"]},
    "Japońska":{"male":["Haruto","Ren","Daichi","Kaito","Sora","Itsuki","Riku","Yuto","Akio","Takeshi","Shin","Hiro"],"female":["Aiko","Yuna","Hana","Mei","Sakura","Emi","Rin","Kaori","Natsumi","Yuki","Mika","Rei"],"neutral":["Akira","Haru","Nao","Makoto","Ren","Sora"],"family":["Sato","Tanaka","Kobayashi","Mori","Ito","Nakamura","Kato","Yamamoto","Fujita","Arai","Shimizu","Kuroda"]},
    "Angielska":{"male":["Arthur","Edwin","Henry","Thomas","William","Edward","George","Alfred","Percival","Roland","Cedric","Hugh"],"female":["Evelyn","Martha","Clara","Iris","Alice","Edith","Rose","Beatrice","Agnes","Florence","Mabel","Diana"],"neutral":["Robin","Alex","Morgan","Taylor","Harper","Riley"],"family":["Blackwood","Hill","Reed","Marsh","Whitlock","Ashford","Graves","Hale","Baker","Fletcher","Ward","Fox"]},
    "Łacińska / Rzymska":{"male":["Marcus","Lucius","Gaius","Titus","Quintus","Aulus","Decimus","Flavius","Cassius","Publius","Severus","Octavius"],"female":["Julia","Livia","Claudia","Aelia","Flavia","Octavia","Cornelia","Aurelia","Valeria","Marcia","Sabina","Tullia"],"neutral":["Aquila","Felix","Maris","Caelus","Vesper","Sol"],"family":["Aurelius","Valerius","Cassius","Marcellus","Flavius","Cornelius","Julius","Severus","Tullius","Varro","Drusus","Cato"]},
    "Germańska":{"male":["Adalbert","Konrad","Ulrich","Friedrich","Otto","Bruno","Ludwig","Gunter","Heinrich","Alarich","Wolfram","Klaus"],"female":["Hilda","Greta","Lisel","Anke","Brunhild","Ilse","Klara","Marta","Adelheid","Frieda","Elke","Lena"],"neutral":["Sascha","Rene","Mika","Toni"],"family":["Vogel","Kramer","Weiss","Hartmann","Schmidt","Bauer","Keller","Wolf","Brandt","Falk","Roth","Adler"]},
    "Celtycka":{"male":["Aidan","Bran","Cormac","Ewan","Declan","Finn","Owen","Rhys","Kieran","Brennan","Niall","Taran"],"female":["Maeve","Nia","Brigid","Riona","Aine","Fiona","Saoirse","Eira","Moira","Gwen","Isolde","Morrigan"],"neutral":["Rowan","Ainsley","Bryn","Morgan","Rory"],"family":["OBrien","MacNair","Kellan","Doyle","Brennan","Callahan","Oaks","Firth","Keane","Murray","Quinn","Vale"]},
    "Grecka":{"male":["Damon","Nikos","Leander","Timon","Alexios","Dorian","Theron","Iason","Milos","Petros","Orion","Stavros"],"female":["Ione","Daphne","Helena","Kora","Thalia","Iris","Selene","Eleni","Calla","Mira","Phoebe","Nika"],"neutral":["Alexis","Dorian","Niko","Aster"],"family":["Pappas","Kallis","Nerios","Theon","Dukas","Melas","Rallis","Kyrkos","Aetos","Lykos","Pharos","Nestor"]},
    "Perska":{"male":["Darius","Farid","Rostam","Bahram","Cyrus","Navid","Arman","Kaveh","Omid","Soroush","Ramin","Kasra"],"female":["Shirin","Laleh","Parisa","Roxana","Mina","Soraya","Azadeh","Darya","Nika","Yasmin","Tara","Roya"],"neutral":["Azar","Noor","Saman","Arya"],"family":["Darvish","Nazari","Farrokh","Mehr","Rostami","Bahari","Pahlav","Kian","Azimi","Sadeh","Ravan","Shahri"]},
    "Hiszpańska":{"male":["Diego","Mateo","Santiago","Rafael","Alonso","Hector","Tomas","Javier","Nicolás","Carlos","Miguel","Esteban"],"female":["Isabel","Lucia","Marina","Carmen","Elena","Sofia","Clara","Ines","Valeria","Rosa","Marta","Lola"],"neutral":["Cruz","Sol","Ángel","Paz"],"family":["Vega","Torres","Navarro","Castillo","Morales","Herrera","Santos","Rojas","Luna","Cortes","Molina","Iglesias"]},
    "Francuska":{"male":["Etienne","Luc","Gaston","Marcel","Hugo","Bastien","Julien","Remy","Alain","Laurent","Nicolas","Noel"],"female":["Claire","Elise","Manon","Adele","Camille","Sophie","Colette","Amelie","Lucie","Odette","Margot","Sylvie"],"neutral":["Camille","Claude","Noel","Dominique"],"family":["Moreau","Lefevre","Roux","Dumont","Garnier","Laurent","Mercier","Renard","Faure","Noir","Blanc","Perrault"]},
    "Włoska":{"male":["Lorenzo","Marco","Silvio","Dante","Matteo","Enzo","Gianni","Paolo","Rocco","Luca","Vittorio","Carlo"],"female":["Giulia","Bianca","Viola","Lucia","Chiara","Franca","Sofia","Alessia","Rosa","Elena","Marta","Serena"],"neutral":["Andrea","Ren","Nico","Vale"],"family":["Conti","Rossi","Ferraro","Bianchi","Romano","Greco","Moretti","Ricci","Costa","Bruno","Gallo","Leone"]},
    "Chińska":{"male":["Wei","Jun","Ming","Hao","Chen","Liang","Bo","Jian","Tao","Zhen","Kai","Shen"],"female":["Mei","Lan","Xiu","Lin","Yue","Jia","An","Qing","Hua","Lian","Xia","Ning"],"neutral":["Rui","Yan","Xin","Yu","Tian","Lei"],"family":["Wang","Li","Zhang","Liu","Chen","Yang","Zhao","Huang","Wu","Zhou","Xu","Sun"]},
    "Koreańska":{"male":["Min-jun","Seo-jun","Ji-ho","Hyun-woo","Do-yun","Joon-ho","Tae-min","Sung-ho","Jae-won","Min-seok","Ki-tae","Hyun"],"female":["Seo-yeon","Ji-eun","Hana","Min-ji","Soo-jin","Ye-jin","Da-eun","Hye-rin","Yuna","Ara","Sora","Eun-ha"],"neutral":["Ji-min","Min","Seo","Hyun","Jae","Yun"],"family":["Kim","Lee","Park","Choi","Jung","Kang","Cho","Yoon","Jang","Lim","Han","Shin"]},
    "Indyjska":{"male":["Arjun","Ravi","Vikram","Dev","Kiran","Amit","Nikhil","Sanjay","Ishan","Rohan","Kabir","Mohan"],"female":["Anika","Priya","Mira","Leela","Asha","Kavya","Nisha","Tara","Isha","Rani","Sana","Divya"],"neutral":["Adi","Kiran","Arya","Devi","Jaya","Navi"],"family":["Sharma","Patel","Rao","Kapoor","Nair","Singh","Mehta","Iyer","Das","Bose","Malik","Chandra"]},
    "Afrykańska ogólna":{"male":["Kwame","Kofi","Amari","Jabari","Tafari","Osei","Malik","Chike","Ade","Sekou","Bakari","Nuru"],"female":["Amina","Zola","Nia","Sade","Imani","Adia","Malaika","Kesia","Asha","Zuri","Nala","Eshe"],"neutral":["Tayo","Nuru","Safi","Ayo","Zola","Lumi"],"family":["Okoro","Mensah","Diallo","Abebe","Traore","Ndlovu","Kone","Bello","Adebayo","Kamara","Mbeki","Sow"]},
    "Egipska":{"male":["Amenhotep","Khaem","Nebu","Ramose","Seti","Hori","Paser","Djehuty","Mentu","Seneb","Ptahmes","Khufu"],"female":["Nefra","Merit","Tia","Henut","Iset","Baket","Nubia","Sitre","Meryt","Kiya","Ahmose","Tanet"],"neutral":["Amun","Raia","Nile","Sahu","Kemet","Ari"],"family":["Neferu","Hotep","Ankh","Senu","Kheper","Meryra","Djed","Wadjet","Bast","Sobek","Ibis","Lotus"]},
    "Turecka":{"male":["Emir","Kerem","Ozan","Murat","Selim","Baran","Yusuf","Deniz","Arda","Levent","Kaan","Tahir"],"female":["Elif","Aylin","Zeynep","Leyla","Meryem","Seda","Asli","Defne","Selin","Esra","Derya","Nazan"],"neutral":["Deniz","Eren","Evren","Tan","Derya","Sarp"],"family":["Yilmaz","Demir","Kaya","Sahin","Arslan","Aydin","Celik","Kurt","Aksoy","Erdem","Kaplan","Polat"]},
    "Mongolska":{"male":["Batu","Temur","Altan","Baatar","Khasar","Naran","Erden","Gan","Tumen","Munkh","Sukh","Jochi"],"female":["Saran","Oyun","Altantsetseg","Enkhjin","Nomin","Tsetseg","Bolormaa","Anu","Khulan","Gerel","Tuya","Oyuka"],"neutral":["Naran","Altan","Saruul","Enkh","Munkh","Tenger"],"family":["Borjigin","Temur","Altai","Khulan","Noyan","Sarnai","Kherlen","Onon","Tolgai","Khan","Ulaan","Mergen"]},
    "Azjatycka ogólna":{"male":["Ren","Taro","Wei","Min-jun","Arjun","Hiro","Kai","Jin","Ravi","Kenji","Bao","Dev"],"female":["Mei","Yuna","Priya","Aiko","Lan","Hana","Sora","Mira","Anika","Lin","Nisha","Rei"],"neutral":["Akira","Rui","Jae","Kiran","Sora","Ren"],"family":["Tanaka","Wang","Kim","Patel","Nakamura","Lee","Rao","Zhang","Park","Ito","Singh","Chen"]}
  }'::jsonb,
  true
)
WHERE generator_type = 'name'
  AND system_code = 'any'
  AND subtype = 'default';
