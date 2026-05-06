-- V24__enhance_name_npc_treasure_generators.sql
-- Richer seed pools for the first production-ready generators:
-- names, D&D NPCs, and D&D treasure.

INSERT INTO generator_pools (generator_type, system_code, subtype, payload_json)
VALUES
  ('name', 'any', 'default', $json$
  {
    "cultures": {
      "Słowiańska": {
        "male": ["Bogdan","Borys","Dobromir","Mirosław","Radek","Stanisław","Witold","Ziemowit","Lech","Kazimir"],
        "female": ["Bogna","Dobrawa","Lada","Milena","Mira","Nadia","Radosława","Svetlana","Zora","Żywia"],
        "neutral": ["Darin","Miran","Radan","Sawa","Vesna","Zorin"],
        "family": ["Czarnybrzeg","Dębowski","Kamieniec","Lisowa","Ruczaj","Wilczyński","Żelazny","Złotnik","Borowy","Sokolik"]
      },
      "Nordycka": {
        "male": ["Bjorn","Eirik","Hakon","Leif","Ragnar","Sten","Torvald","Ulf","Vidar","Yngvar"],
        "female": ["Astrid","Freya","Gudrun","Ingrid","Liv","Runa","Sigrid","Solveig","Thora","Yrsa"],
        "neutral": ["Ari","Eivor","Kari","Rune","Skadi","Tove"],
        "family": ["Frostbeard","Ironhand","Northwake","Ravenmark","Skaldsen","Stormsen","Thundershield","Winterborn"]
      },
      "Arabska": {
        "male": ["Adil","Farid","Hakim","Jabir","Khalil","Nadir","Rashid","Samir","Tariq","Zahir"],
        "female": ["Amina","Dalia","Faridah","Jamila","Layla","Nadia","Rania","Samira","Yasmin","Zahra"],
        "neutral": ["Amal","Hayat","Nur","Rafi","Sahar","Zayn"],
        "family": ["al-Nasir","al-Qadir","ibn Farah","bint Rashid","al-Hakim","al-Samar","al-Zahir"]
      },
      "Japońska": {
        "male": ["Daichi","Haruto","Kaito","Ren","Riku","Sora","Takumi","Yori","Yuki","Zen"],
        "female": ["Aiko","Emi","Hana","Hikari","Kira","Mei","Sakura","Yui","Yuna","Rei"],
        "neutral": ["Akira","Haru","Hinata","Kaede","Makoto","Nao"],
        "family": ["Akiyama","Fujimoto","Hayashi","Kurosawa","Mizuno","Nakamura","Shirogane","Takahashi"]
      },
      "Elficka": {
        "male": ["Aelar","Eldrin","Faelar","Kaelen","Laucian","Rolen","Theren","Varis","Yllan","Zairon"],
        "female": ["Aeris","Ilyra","Lia","Meriel","Naivara","Seraphine","Shava","Sylvarie","Veyra","Yllaria"],
        "neutral": ["Arieth","Elaris","Lioren","Sael","Thalion","Vaelis"],
        "family": ["Moonveil","Silverleaf","Starfall","Dawnwhisper","Nightbloom","Amberwind","Dusksong","Mistvale"]
      },
      "Krasnoludzka": {
        "male": ["Balin","Borin","Dain","Durik","Fargrim","Kargan","Oskar","Thorin","Ulfgar","Vondal"],
        "female": ["Bruni","Dagna","Diesa","Eldeth","Gunnloda","Hlin","Kathra","Sannl","Torgga","Vistra"],
        "neutral": ["Barik","Dorrin","Grim","Kili","Nori","Tarin"],
        "family": ["Anvilborn","Deepdelver","Forgehand","Goldvein","Granitejaw","Ironmantle","Stonehelm","Underpeak"]
      },
      "Orcza": {
        "male": ["Brug","Dorn","Ghaz","Grum","Karg","Mog","Rok","Thokk","Urz","Varg"],
        "female": ["Baggi","Ekk","Gorga","Mura","Nakka","Oga","Ragga","Shautha","Ugra","Zagga"],
        "neutral": ["Ash","Ghor","Krug","Narg","Skarn","Ur"],
        "family": ["Bloodtusk","Bonebreaker","Ironmaw","Ragehide","Skullsplitter","Stormfang","Warhowl"]
      },
      "Fantastyczna": {
        "male": ["Alaric","Corvin","Darian","Lucan","Malachar","Orion","Silas","Thamior","Varric","Zephran"],
        "female": ["Elara","Isolde","Kaela","Lyra","Maris","Nyx","Selene","Talia","Ysolde","Zaria"],
        "neutral": ["Ashen","Cyr","Ember","Lumen","Noctis","Sable"],
        "family": ["Ashthorne","Blackwater","Duskwick","Emberlane","Greywatch","Silverrook","Stormglass","Thornfield"]
      }
    }
  }
  $json$::jsonb),

  ('npc', 'dnd', 'default', $json$
  {
    "races": ["Człowiek","Elf","Krasnolud","Niziołek","Gnom","Półelf","Półork","Tiefling","Dragonborn"],
    "professions": ["Strażnik","Kupiec","Wiedźma","Złodziej","Kapłan","Szlachcic","Chłop","Żołnierz","Magik","Łowca nagród","Skryba","Alchemik"],
    "roles": ["Villain","Quest Giver","Ally","Contact","Neutral","Rival","Informant"],
    "alignments": ["Lawful Good","Neutral Good","Chaotic Good","Lawful Neutral","True Neutral","Chaotic Neutral","Lawful Evil","Neutral Evil","Chaotic Evil"],
    "names": ["Alaric","Mira","Thorin","Selene","Varis","Eldrin","Kaela","Brom","Isolde","Darian","Brynn","Malachar","Talia","Varric","Nyx"],
    "family": ["Darrowdale","Stormglass","Blackwater","Ashthorne","Kettlewick","Ravenmark","Duskwick","Goldvein","Silverrook","Thornfield"],
    "appearance": {
      "build": ["szczupła sylwetka","masywna postura","nerwowe ruchy","proste wojskowe plecy","zgarbiona postawa","eleganckie gesty"],
      "face": ["blizna przez policzek","złoty ząb","jedno oko jaśniejsze od drugiego","wiecznie zmęczone spojrzenie","tatuaż przy skroni","nos złamany więcej niż raz"],
      "clothes": ["ciemny płaszcz podróżny","wytarta skórzana kamizela","płaszcz z haftem rodu","poplamiony fartuch","prosta szata z ukrytymi kieszeniami","zbroja naprawiana wielokrotnie"]
    },
    "personalities": ["cyniczny i bezpośredni","uprzejmy aż do przesady","milczący obserwator","porywczy i dumny","serdeczny, ale podejrzliwy","wyrachowany i spokojny","nerwowy, lecz kompetentny"],
    "ideals": ["wolność ponad porządek","rodzina jest ważniejsza niż prawo","wiedza usprawiedliwia ryzyko","honor ma cenę, ale zdrada kosztuje więcej","złoto rozwiązuje większość problemów","bogowie pomagają tym, którzy działają"],
    "secrets": ["pracuje dla lokalnej gildii złodziei","jest zbiegiem pod fałszywym nazwiskiem","ukrywa dług wobec niebezpiecznej osoby","zna prawdziwą przyczynę ostatniej katastrofy","sprzedał informację wrogiej frakcji","chroni kogoś, kto powinien stanąć przed sądem"],
    "motivations": ["spłacić dług zanim wierzyciel straci cierpliwość","odzyskać utracony honor rodu","znaleźć zaginioną osobę","zbudować wpływy w mieście","zemścić się na dawnym patronie","wykupić bliską osobę z niewoli"],
    "hooks": ["prosi drużynę o dyskretną przysługę","ma mapę, ale nie ma odwagi iść sam","wie, kto kłamie w obecnym śledztwie","może otworzyć ważne drzwi, jeśli drużyna coś dla niego zrobi","jest świadkiem, którego ktoś chce uciszyć"],
    "attacks": ["Sztylet","Krótki miecz","Kusza lekka","Laska","Młot bojowy","Ognisty pocisk"]
  }
  $json$::jsonb),

  ('loot', 'dnd', 'default', $json$
  {
    "gems": [
      {"name":"obsydian","value":10},{"name":"agat pasiasty","value":10},{"name":"kwarc dymny","value":50},{"name":"kamień księżycowy","value":50},
      {"name":"ametyst","value":100},{"name":"granat","value":100},{"name":"szafir gwiezdny","value":500},{"name":"czarna perła","value":500},
      {"name":"rubina łza","value":1000},{"name":"szmaragd w srebrnej oprawie","value":1000}
    ],
    "artObjects": [
      {"name":"srebrny kielich z herbem zapomnianej rodziny","value":25},
      {"name":"mała ikona z kości i bursztynu","value":50},
      {"name":"złoty sygnet z pękniętym oczkiem","value":100},
      {"name":"haftowana maska ceremonialna","value":250},
      {"name":"miniaturowy portret w ramie z kości słoniowej","value":500},
      {"name":"starożytny astrolabium z mosiądzu","value":750}
    ],
    "magicItems": {
      "common": ["Potion of Healing","Spell Scroll (cantrip)","Moon-Touched Sword","Cloak of Billowing","Driftglobe"],
      "uncommon": ["Bag of Holding","Potion of Greater Healing","Cloak of Protection","Boots of Elvenkind","Wand of Magic Detection"],
      "rare": ["+1 Weapon with a named maker mark","Ring of Evasion","Potion of Superior Healing","Amulet of Health","Staff of Defense"],
      "veryRare": ["+2 Weapon with a sleeping rune","Cloak of Arachnida","Potion of Supreme Healing","Rod of Absorption"],
      "legendary": ["Vorpal Blade fragment","Ring of Three Wishes with one faded charge","Staff of the Magi rumor-token"]
    },
    "mundaneItems": ["pęk żelaznych kluczy","mapa lokalnej okolicy","zapieczętowany list","kościane kości do gry","fiolka atramentu","kompas z pękniętym szkłem","mały notes z długami"],
    "containers": ["w ciężkiej skrzyni","w workach pod luźną deską","w glinianych dzbanach","w fałszywym dnie kufra","rozsypany wśród kości","w zamkniętej kasetce z mosiądzu"],
    "hidingPlaces": ["za ruchomym kamieniem","pod posadzką","w niszy za gobelinem","w kominie starego paleniska","w sekretnym schowku stołu","wśród rupieci, które wyglądają bezwartościowo"],
    "quirks": ["na dnie leży inicjał poprzedniego właściciela","jedna moneta jest wyraźnie starsza od reszty","skarb pachnie ozonem","ktoś niedawno zabrał najcenniejszy przedmiot","w środku ukryto krótką groźbę","po otwarciu słychać cichy klik mechanizmu"]
  }
  $json$::jsonb)
ON CONFLICT (generator_type, system_code, subtype) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    updated_at = now();
