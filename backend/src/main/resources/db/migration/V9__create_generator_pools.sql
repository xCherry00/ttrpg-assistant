-- V9__create_generator_pools.sql
-- Pula danych dla generatorow (NPC, przedmioty, postacie)

CREATE TABLE IF NOT EXISTS generator_pools (
  id BIGSERIAL PRIMARY KEY,
  generator_type VARCHAR(32) NOT NULL,
  system_code VARCHAR(32) NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ux_generator_pool_type_system UNIQUE (generator_type, system_code)
);

INSERT INTO generator_pools (generator_type, system_code, payload_json)
VALUES
  ('npc', 'dnd', $json$
  {
    "names": ["Alaric","Mira","Thorin","Selene","Varis","Eldrin","Kaela","Brom","Isolde","Darian"],
    "archetypes": ["Strażnik miejski","Alchemik","Najemnik","Kapłanka","Kupiec","Łowca nagród","Bajarz","Stajenny","Herborystka","Skryba"],
    "traits": ["uprzejmy","podejrzliwy","porywczy","spokojny","tajemniczy","arogancki","serdeczny","chłodny","nerwowy","zgryźliwy"],
    "motives": ["chce spłacić dług","szuka zaginionej siostry","chroni swoją dzielnicę","pragnie władzy","ukrywa klątwę","zbiera pieniądze na wykup","poluje na zdrajcę","chce odzyskać honor rodu","ukrywa nielegalny interes","boi się nadchodzącej wojny"]
  }
  $json$::jsonb),
  ('npc', 'cthulhu', $json$
  {
    "names": ["Evelyn Marsh","Arthur Hill","Samuel Boyd","Irene West","Caleb Stone","Martha Keane","Edgar Price","Helen Fox","Nathan Reed","Victor Hale"],
    "archetypes": ["Bibliotekarka","Detektyw","Lekarz","Dziennikarz","Właściciel antykwariatu","Archeolog","Psychiatra","Policjant","Fotograf","Profesor historii"],
    "traits": ["nerwowy","metodyczny","opanowany","zimny","nadmiernie ciekawski","empatyczny","milczący","paranoiczny","wyniosły","dociekliwy"],
    "motives": ["ukrywa zakazany dziennik","boi się rodzinnej tajemnicy","obsesyjnie szuka prawdy","chce zamknąć śledztwo","chroni reputację rodu","słyszy głosy z piwnicy","spłaca dług wobec kultu","szuka zaginionego syna","próbuje zapomnieć o wojnie","pilnuje kompromitujących akt"]
  }
  $json$::jsonb),
  ('npc', 'wh4e', $json$
  {
    "names": ["Klaus","Brunna","Otto","Hedwig","Rudiger","Frieda","Matthias","Ulrich","Greta","Lenz"],
    "archetypes": ["Łowca szczurów","Żołnierz","Kupiec","Cyrulik","Poborca podatkowy","Kowal","Wędrowny kaznodzieja","Żebrak","Przemytnik","Pisarz miejski"],
    "traits": ["gburowaty","pragmatyczny","chciwy","honorowy","gadatliwy","ponury","wyrachowany","życzliwy","uparty","cierpliwy"],
    "motives": ["próbuje przeżyć zimę","szuka protektora","ucieka przed prawem","chce odzyskać rodzinny interes","zbiera informacje dla gildii","spłaca długi hazardowe","ukrywa mutację","chce awansować w cechu","szuka zemsty","przemyca relikwię"]
  }
  $json$::jsonb),
  ('npc', 'pf2e', $json$
  {
    "names": ["Neriah","Brom","Kestrel","Liora","Dain","Meris","Toren","Asha","Viren","Koda"],
    "archetypes": ["Zwiadowca","Akolita","Rzemieślnik run","Łowca","Posłaniec gildii","Alchemik","Strażnik graniczny","Skaut ruin","Mediatorka","Kartograf"],
    "traits": ["energiczny","sarkastyczny","ostrożny","lojalny","ambitny","towarzyski","milczący","nieufny","zdyscyplinowany","porywczy"],
    "motives": ["szuka artefaktu","chroni klan","zbiera fundusze na wyprawę","chce odkupić winy","buduje własną reputację","ściga zdrajcę","zbiera mapy ruin","szuka nauczyciela magii","ucieka przed paktem","odbudowuje świątynię"]
  }
  $json$::jsonb),
  ('npc', 'morkborg', $json$
  {
    "names": ["Grim","Sister Rot","Varn","Ghast","Nail","Wretch","Mire","Skarn","Rotfang","Ash"],
    "archetypes": ["Włóczęga","Heretyk","Łowca relikwii","Kat","Zbieracz kości","Pogrobowiec","Grabieżca krypt","Ślepy prorok","Rzeźnik","Dzwonnik"],
    "traits": ["ponury","brutalny","cyniczny","milczący","fanatyczny","drażliwy","bezlitosny","obojętny","impulsywny","przejęty omenem"],
    "motives": ["czeka na koniec świata","poluje na relikwię","chce pomścić sektę","ucieka przed wyrokiem","sprzedaje sekrety za żelazo","szuka świętej rdzy","ściga zdrajcę kultu","próbuje przeżyć kolejny tydzień","chroni przeklętego towarzysza","zbiera kości proroków"]
  }
  $json$::jsonb),

  ('item', 'dnd', $json$
  {
    "types": ["Broń","Pancerz","Artefakt","Mikstura","Zwój","Fokus","Amulet"],
    "names": ["Latarnia Wiecznego Wiatru","Sztylet Jesiennego Cienia","Puchar Echo","Płaszcz Szeptów","Pierścień Strażnika","Laska Gwiezdnego Pyłu","Naszyjnik Burzowego Szkła","Rękawica Cienia","Kompas Łowcy","Miecz Popiołu"],
    "effects": ["daje przewagę raz na odpoczynek","wzmacnia obronę przeciw magii","ujawnia ukryte ślady","przyspiesza regenerację","pozwala zadać dodatkowe obrażenia żywiołu","pozwala wykryć iluzję","zwiększa szybkość ruchu","osłabia cel po trafieniu","wzmacnia testy percepcji","dodaje ochronę przed ogniem"]
  }
  $json$::jsonb),
  ('item', 'cthulhu', $json$
  {
    "types": ["Relikt","Księga","Narzędzie","Amulet","Notatnik","Fotografia","Mapa"],
    "names": ["Notatnik doktora K.","Srebrny sygnet Innsmouth","Lornetka marynarza","Czarna świeca","Klucz z kości","Album ze zdjęciami z Arkham","Mapa tuneli pod miastem","Pióro medium","Dziennik kapitana","Złamany zegarek świadka"],
    "effects": ["obniża stres przy badaniu","ułatwia analizę tropów","wzmacnia testy okultystyczne","przyciąga niepokój","otwiera zapieczętowane schowki","wskazuje obecność rytuału","ułatwia przesłuchanie świadka","odkrywa ukryte przejście","wzmacnia test medycyny sądowej","wywołuje wizje przeszłości"]
  }
  $json$::jsonb),
  ('item', 'wh4e', $json$
  {
    "types": ["Broń","Pancerz","Narzędzie","Relikwia","Towar","Dokument","Trunek"],
    "names": ["Młot cechowy","Skórzana kurtka strażnika","Tarcza z Altdorfu","Kadzielnica Sigmara","Pęk pism urzędowych","Pieczęć urzędnika","Topór pogranicznika","Beczka gorzkiego piwa","Pancerz milicji","Moneta łowcy czarownic"],
    "effects": ["zwiększa szanse w testach siły","daje premię do zastraszania","ułatwia negocjacje z gildią","wspiera testy wiary","zmniejsza koszt podróży","ułatwia wejście do urzędu","daje premię w walce ulicznej","wzmacnia morale drużyny","obniża koszt napraw ekwipunku","pomaga w testach śledczych"]
  }
  $json$::jsonb),
  ('item', 'pf2e', $json$
  {
    "types": ["Runa","Broń","Fokus","Mikstura","Talizman","Relikt","Pancerz"],
    "names": ["Talizman Żelaznego Jastrzębia","Runa Mroźnego Kroku","Laska Rezonansu","Fiolka Lazurowej Żywicy","Sznur Mistrza Tropu","Sigil Smoczej Iskry","Płytki pancerz Strażnika Wrót","Runa Cichego Kroku","Wisiorek Sfery Prawdy","Rapier Feniksa"],
    "effects": ["wspiera mobilność","wzmacnia pierwszy atak","zwiększa skuteczność czarów","podbija obronę na turę","ułatwia testy zręczności","ułatwia uniki","wzmacnia odporność psychiczną","dodaje premię do inicjatywy","skraca czas rzucania","zwiększa zasięg umiejętności"]
  }
  $json$::jsonb),
  ('item', 'morkborg', $json$
  {
    "types": ["Żelastwo","Relikwia","Urok","Narzędzie","Broń","Maska","Szczątki"],
    "names": ["Zardzewiała Korona","Gwizdek Trumienny","Kościany Hak","Maska Popiołu","Dzwon Ostatniej Mszy","Szpon Czarnej Bestii","Kaptur Głuchego Mnicha","Łańcuch Pokutnika","Słoik Martwego Śmiechu","Kolec Zarazy"],
    "effects": ["zwiększa obrażenia kosztem HP","przywołuje ponury omen","osłabia wolę przeciwnika","pozwala ominąć pułapkę","nakłada klątwę na cel","wzmacnia atak po stracie krwi","obniża morale wrogów","zwiększa odporność na ból","ułatwia zastraszanie","tworzy aurę rozkładu"]
  }
  $json$::jsonb),

  ('character', 'dnd', $json$
  {
    "entries": [
      {"role":"front","style":"agresywny","name":"Wojownik","pitch":"klasyczny frontliner z mocną obroną"},
      {"role":"magic","style":"taktyczny","name":"Czarodziej","pitch":"kontrola pola walki i przewaga pozycyjna"},
      {"role":"support","style":"wsparcie","name":"Kleryk","pitch":"leczenie, buffy i stabilna drużyna"},
      {"role":"stealth","style":"spryt","name":"Łotrzyk","pitch":"mobilność, pułapki i precyzyjne uderzenia"}
    ]
  }
  $json$::jsonb),
  ('character', 'cthulhu', $json$
  {
    "entries": [
      {"role":"front","style":"agresywny","name":"Były żołnierz","pitch":"silny pod presją i odporny psychicznie"},
      {"role":"magic","style":"taktyczny","name":"Okultysta","pitch":"wiedza zakazana i rytuały wysokiego ryzyka"},
      {"role":"support","style":"wsparcie","name":"Lekarz","pitch":"stabilizuje drużynę i obniża chaos sceny"},
      {"role":"stealth","style":"spryt","name":"Detektyw","pitch":"tropy, obserwacja i szybkie wnioski"}
    ]
  }
  $json$::jsonb),
  ('character', 'wh4e', $json$
  {
    "entries": [
      {"role":"front","style":"agresywny","name":"Najemnik","pitch":"bezpośrednie starcia i presja na przeciwniku"},
      {"role":"magic","style":"taktyczny","name":"Uczeń maga","pitch":"elastyczna magia, ale wysokie ryzyko"},
      {"role":"support","style":"wsparcie","name":"Kapłan","pitch":"podtrzymuje morale i kontroluje tempo starcia"},
      {"role":"stealth","style":"spryt","name":"Szelma","pitch":"intryga, skradanie i brudne zagrania"}
    ]
  }
  $json$::jsonb),
  ('character', 'pf2e', $json$
  {
    "entries": [
      {"role":"front","style":"agresywny","name":"Barbarzyńca","pitch":"duże tempo i silny nacisk ofensywny"},
      {"role":"magic","style":"taktyczny","name":"Magus","pitch":"łączenie magii i walki wręcz"},
      {"role":"support","style":"wsparcie","name":"Bard","pitch":"synergia drużyny i kontrola sceny"},
      {"role":"stealth","style":"spryt","name":"Łowca","pitch":"śledzenie celu i precyzyjny focus"}
    ]
  }
  $json$::jsonb),
  ('character', 'morkborg', $json$
  {
    "entries": [
      {"role":"front","style":"agresywny","name":"Skazańca","pitch":"agresja i brutalne wejścia"},
      {"role":"magic","style":"taktyczny","name":"Heretyk","pitch":"mroczne sztuczki i nieprzewidywalne efekty"},
      {"role":"support","style":"wsparcie","name":"Kaznodzieja ruin","pitch":"wzmacnia morale mimo beznadziei"},
      {"role":"stealth","style":"spryt","name":"Nocny łupieżca","pitch":"atak z zaskoczenia i szybkie wycofanie"}
    ]
  }
  $json$::jsonb)
ON CONFLICT (generator_type, system_code) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
