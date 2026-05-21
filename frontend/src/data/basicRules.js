export const BASIC_RULES = [
  {
    systemCode: "dnd5e",
    rulesApiCode: "dnd",
    name: "D&D 5e",
    legalStatus: "local-summary-with-attribution",
    legalNote:
      "Skrot oparty o ogolne zasady i tresci dostepne w SRD/Basic Rules. Nie zawiera pelnego podrecznika.",
    sourcePolicy: "summary-with-attribution",
    sources: [
      { name: "D&D SRD 5.1 / 5.2", url: "https://www.dndbeyond.com/srd" },
      { name: "D&D Beyond Basic Rules", url: "https://www.dndbeyond.com/sources/basic-rules" },
    ],
    sections: {
      overview:
        "D&D 5e to heroic fantasy, w ktorym druzyna postaci eksploruje swiat, rozwiazuje konflikty, walczy z przeciwnikami i rozwija sie przez kolejne poziomy.",
      "core-test":
        "Podstawowy test to rzut d20 + odpowiedni modyfikator. Wynik porownuje sie z poziomem trudnosci DC albo z Armor Class przeciwnika. Jesli wynik jest rowny lub wyzszy, test zwykle konczy sie sukcesem.",
      "character-creation":
        "Postac zwykle sklada sie z rasy/pochodzenia, klasy, tla, szesciu atrybutow, bieglosci, ekwipunku i zaklec, jesli klasa ich uzywa.",
      combat:
        "Walka dziala w rundach i turach. Kolejnosc ustala inicjatywa. W swojej turze postac zwykle moze sie poruszyc, wykonac akcje, czasem akcje bonusowa i pozniej reakcje poza swoja tura.",
      health:
        "Punkty zycia okreslaja wytrzymalosc postaci. Armor Class okresla trudnosc trafienia. Po spadku do 0 HP postac jest zagrozona smiercia i uzywa mechaniki death saving throws, jesli dana sytuacja tego wymaga.",
      progression:
        "Rozwoj odbywa sie przez poziomy. Postac zyskuje nowe cechy klasowe, wieksza wytrzymalosc, lepsze mozliwosci walki, zaklecia lub inne zdolnosci.",
      "game-flow":
        "Typowa sesja sklada sie z opisu sceny przez MG, deklaracji dzialan graczy, testow, konsekwencji, walki lub eksploracji, a potem rozwoju fabuly.",
    },
  },
  {
    systemCode: "cthulhu7e",
    rulesApiCode: "cthulhu",
    name: "Call of Cthulhu 7e",
    legalStatus: "local-summary-link-only",
    legalNote:
      "W aplikacji trzymamy tylko wlasne streszczenie i link do oficjalnego Quick-Start. Nie kopiujemy duzych fragmentow PDF.",
    sourcePolicy: "link-only",
    sources: [
      {
        name: "Chaosium Call of Cthulhu 7th Edition Quick-Start Rules",
        url: "https://www.chaosium.com/free-downloads/",
      },
    ],
    sections: {
      overview:
        "Call of Cthulhu 7e to gra sledczo-horrorowa, w ktorej badacze odkrywaja tajemnice, konfrontuja sie z zagrozeniami Mythosu i czesto ryzykuja zdrowie psychiczne bardziej niz zwykle obrazenia.",
      "core-test":
        "Podstawowa mechanika opiera sie na rzucie k100. Umiejetnosci i cechy maja wartosci procentowe. Test zwykle konczy sie sukcesem, jesli wynik jest rowny lub nizszy od odpowiedniej wartosci.",
      "character-creation":
        "Postac jest badaczem. Wazne sa cechy, umiejetnosci, profesja, motywacje, kontakty i zasoby. Postacie nie sa superbohaterami, tylko ludzmi narazonymi na zjawiska, ktorych nie rozumieja.",
      combat:
        "Walka jest niebezpieczna i czesto mniej korzystna niz ucieczka, negocjacje albo ostrozne dzialanie. System premiuje sledztwo i przetrwanie, nie ciagle starcia.",
      health:
        "Istotne sa punkty zycia oraz Sanity. Utrata Sanity odzwierciedla kontakt z trauma, koszmarem i Mythosem. Psychiczne konsekwencje moga byc rownie wazne jak obrazenia fizyczne.",
      progression:
        "Rozwoj postaci zwykle wynika z uzywania umiejetnosci, doswiadczen fabularnych i konsekwencji sledztwa. Postac moze stawac sie skuteczniejsza, ale nie zmienia sie w heroiczna jednostke odporna na zagrozenia.",
      "game-flow":
        "Typowa sesja opiera sie na zleceniu lub tajemnicy, zbieraniu tropow, rozmowach, analizie poszlak, odkrywaniu prawdy i konfrontacji z czyms groznym albo niezrozumialym.",
    },
  },
  {
    systemCode: "wfrp4e",
    rulesApiCode: "wh4e",
    name: "Warhammer 4e",
    legalStatus: "local-summary-link-only",
    legalNote:
      "Brak pelnego darmowego SRD do lokalnego przechowywania zasad. Aplikacja zawiera tylko wlasny ogolny skrot i linki do oficjalnych darmowych zasobow.",
    sourcePolicy: "link-only",
    sources: [
      { name: "Cubicle 7 WFRP Free Resources", url: "https://cubicle7games.com/en_EU/free-tabletop-roleplaying-games" },
      { name: "WFRP starter/startowe materialy", url: "https://cubicle7games.com/" },
    ],
    sections: {
      overview:
        "Warhammer Fantasy Roleplay 4e to mroczne, brutalne fantasy, w ktorym postacie sa czescia niebezpiecznego swiata pelnego korupcji, chorob, przemocy, Chaosu i spolecznych napiec.",
      "core-test":
        "System uzywa testow procentowych. Rzut k100 porownuje sie z odpowiednia cecha lub umiejetnoscia. Nizszy wynik zwykle oznacza lepszy rezultat, a stopien sukcesu lub porazki moze wplywac na jakosc efektu.",
      "character-creation":
        "Postac okreslaja cechy, umiejetnosci, talenty, rasa, profesja i kariera. Kariera ma duze znaczenie, bo opisuje miejsce postaci w swiecie i kierunek jej rozwoju.",
      combat:
        "Walka jest ryzykowna, taktyczna i moze prowadzic do powaznych konsekwencji. Znaczenie maja przewagi, pozycja, bron, pancerz, trafienia i efekty krytyczne.",
      health:
        "Postacie moga otrzymywac rany, krytyki i dlugofalowe konsekwencje. Starcia sa grozne, a obrazenia moga zostawic trwaly slad.",
      progression:
        "Rozwoj odbywa sie przez kariere, wydawanie doswiadczenia, rozwijanie cech, umiejetnosci i talentow. Postac moze zmieniac sciezki kariery.",
      "game-flow":
        "Typowa sesja laczy sledztwo, spoleczne konflikty, podroze, walke, zagrozenie Chaosem i trudne decyzje moralne.",
    },
  },
  {
    systemCode: "pf2e",
    rulesApiCode: "pf2e",
    name: "Pathfinder 2e",
    legalStatus: "local-summary-with-links",
    legalNote:
      "Najbezpieczniej linkowac do Archives of Nethys i trzymac w aplikacji tylko wlasny skrot. Nie kopiowac duzych baz danych bez pelnej weryfikacji licencji i atrybucji.",
    sourcePolicy: "summary-with-links",
    sources: [
      { name: "Archives of Nethys Pathfinder 2e", url: "https://2e.aonprd.com/" },
      { name: "Paizo Getting Started", url: "https://paizo.com/pathfinder/getstarted" },
    ],
    sections: {
      overview:
        "Pathfinder 2e to taktyczne fantasy oparte na precyzyjnych zasadach, rozwoju postaci przez poziomy i duzej liczbie wyborow mechanicznych.",
      "core-test":
        "Podstawowy test to rzut d20 + modyfikator przeciwko DC. System czesto rozroznia cztery stopnie wyniku: critical success, success, failure i critical failure. Roznica 10 lub wiecej od DC zwykle decyduje o krytycznym wyniku.",
      "character-creation":
        "Postac tworzy sie przez wybor pochodzenia, dziedzictwa, tla, klasy, atrybutow, umiejetnosci i atutow. Duza czesc rozwoju opiera sie na regularnych wyborach atutow.",
      combat:
        "Walka dziala na systemie trzech akcji na ture. Postac moze laczyc ruch, ataki, uzycie przedmiotow, zaklecia i inne aktywnosci. Reakcje sa osobnym typem dzialania.",
      health:
        "Punkty zycia okreslaja wytrzymalosc. Wazne sa tez pancerz, rzuty obronne, stany i efekty krytyczne. System mocno wykorzystuje warunki i precyzyjne modyfikatory.",
      progression:
        "Rozwoj odbywa sie poziomami. Postac otrzymuje nowe atuty, zdolnosci klasowe, zwiekszenia umiejetnosci i kolejne opcje mechaniczne.",
      "game-flow":
        "Typowa sesja laczy eksploracje, encountery, testy umiejetnosci, walke taktyczna i rozwoj fabularny.",
    },
  },
  {
    systemCode: "morkborg",
    rulesApiCode: "morkborg",
    name: "Mork Borg",
    legalStatus: "local-summary-with-link",
    legalNote:
      "Bare Bones Edition jest darmowym zrodlem referencyjnym, ale aplikacja nadal uzywa wlasnego skrotu i linku do zrodla.",
    sourcePolicy: "summary-with-link",
    sources: [
      { name: "MORK BORG Bare Bones Edition", url: "https://jnohr.itch.io/mrk-borg-free" },
      { name: "Official MORK BORG site", url: "https://www.morkborg.com/" },
    ],
    sections: {
      overview:
        "Mork Borg to krotki, brutalny, apokaliptyczny system OSR, nastawiony na szybkie rozstrzygniecia, smierc, groteske i ponury klimat konca swiata.",
      "core-test":
        "Podstawa sa proste rzuty k20 przeciwko trudnosci DR. Wiele sytuacji rozstrzygaja szybkie testy, a zasady sa celowo lekkie.",
      "character-creation":
        "Postacie sa kruche, dziwne i czesto skazane na marny koniec. Tworzenie postaci jest szybkie, a duze znaczenie maja losowe elementy, ekwipunek i klimat.",
      combat:
        "Walka jest smiertelna i szybka. Gracze czesto rzucaja za swoje dzialania ofensywne i defensywne. Lepiej myslec ostroznie niz zakladac, ze kazda walka jest do wygrania.",
      health:
        "Postacie maja niewiele wytrzymalosci, a obrazenia szybko staja sie powaznym problemem. Smierc lub trwale konsekwencje sa naturalna czescia gry.",
      progression:
        "Rozwoj jest prosty i mniej rozbudowany niz w heroic fantasy. Wazniejszy jest klimat, przetrwanie i konsekwencje niz dlugie planowanie buildow.",
      "game-flow":
        "Typowa sesja to eksploracja, ryzyko, szybkie decyzje, dziwne znaleziska, brutalne starcia i narastajace poczucie konca swiata.",
    },
  },
];

export const BASIC_RULES_BY_API_CODE = Object.fromEntries(BASIC_RULES.map((rule) => [rule.rulesApiCode, rule]));

export const STATUS_LABELS = {
  "local-summary": "local-summary",
  "local-summary-with-attribution": "local-summary-with-attribution",
  "local-summary-with-links": "local-summary-with-links",
  "local-summary-with-link": "local-summary-with-link",
  "local-summary-link-only": "link-only",
  "requires-verification": "requires-verification",
};
