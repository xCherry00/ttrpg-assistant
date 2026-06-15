export const BASIC_RULES = [
  {
    systemCode: "general-rpg",
    rulesApiCode: "general",
    name: "Ogólne zasady RPG",
    legalStatus: "local-summary",
    legalNote: "Skrót ogólnych zasad gry fabularnej dla początkujących.",
    sourcePolicy: "summary",
    sources: [
      { name: "TTRPG Assistant - skrót zasad ogólnych", url: "#" },
    ],
    sections: {
      overview:
        "Gry RPG to forma wspólnego tworzenia historii. Gracze wcielają się w fikcyjne postacie i decydują, co one robią, mówią oraz do czego dążą. Mistrz Gry opisuje świat, miejsca, bohaterów niezależnych, zagrożenia i skutki działań drużyny. W odróżnieniu od gry planszowej RPG zwykle nie ma jednej planszy ani z góry ustalonej listy ruchów, a w odróżnieniu od gry komputerowej nie ogranicza Cię kod programu. Najważniejsze są rozmowa, wyobraźnia, decyzje przy stole i wspólne ustalanie, co dzieje się dalej.",
      "core-test":
        "Test wykonuje się wtedy, gdy postać próbuje zrobić coś ważnego, a wynik nie jest oczywisty. Jeśli bohater spokojnie otwiera zwykłe drzwi, test nie jest potrzebny. Jeśli próbuje sforsować zamek pod presją czasu, przekonać strażnika albo przeskoczyć nad przepaścią, rzut pomaga rozstrzygnąć sytuację. Wynik testu nie musi dzielić świata tylko na sukces i porażkę. Nieudany rzut może oznaczać komplikacje, koszt, utratę czasu, zwrócenie uwagi przeciwników albo nowy problem, który popycha historię naprzód.",
      "character-creation":
        "Gracz prowadzi swoją postać: opisuje jej decyzje, reakcje, zamiary i sposób działania. Postać gracza to bohater tej osoby w świecie gry. Może mieć imię, wygląd, charakter, umiejętności, słabe strony, ekwipunek, relacje i własne cele. Nie trzeba od razu grać teatralnie ani mówić innym głosem. Wystarczy powiedzieć, co postać robi i dlaczego. Z czasem wielu graczy zaczyna dodawać sposób mówienia, gesty, przekonania i emocje bohatera, bo pomaga to poczuć, że postać jest czymś więcej niż zestawem liczb na karcie.",
      combat:
        "Mistrz Gry prowadzi świat gry. Opisuje sceny, miejsca, pogodę, nastrój, przeciwników, sojuszników i zwykłych mieszkańców świata. Przedstawia wyzwania, zadaje pytania graczom, odgrywa postacie niezależne i pomaga rozstrzygać konsekwencje działań. MG nie jest przeciwnikiem graczy. Jego zadaniem jest prowadzenie ciekawej, spójnej sytuacji, w której decyzje drużyny mają znaczenie. Czasem oznacza to walkę, czasem rozmowę, śledztwo, ucieczkę, negocjacje albo trudny wybór bez idealnego rozwiązania.",
      health:
        "Typowa sesja to jedno spotkanie graczy i Mistrza Gry. Może odbywać się przy stole, online albo w mieszanej formie. Najczęściej MG opisuje sytuację, gracze mówią, co robią ich postacie, a potem grupa ustala, jaki jest skutek. Gra przechodzi przez sceny: rozmowę w karczmie, badanie ruin, pościg, starcie, odpoczynek, naradę albo spotkanie z ważną postacią. Nie każda scena wymaga rzutu. Czasem wystarczy dobra decyzja, ciekawa rozmowa albo logiczny plan.",
      progression:
        "Odgrywanie postaci oznacza patrzenie na wydarzenia oczami bohatera. Gracz może zadać sobie pytanie: czego moja postać chce, czego się boi, komu ufa i co jest dla niej ważne? Nie chodzi o aktorstwo ani perfekcyjny występ. Chodzi o podejmowanie decyzji, które pasują do postaci i tworzą ciekawą historię z resztą drużyny. RPG działa najlepiej, gdy gracze słuchają siebie nawzajem, dają innym miejsce przy stole i budują sceny wspólnie zamiast próbować wygrać kosztem całej grupy.",
      "game-flow":
        "Kampania to seria połączonych sesji, w których wracają te same postacie, wątki, miejsca i konsekwencje dawnych wyborów. Jedna sesja może być osobną przygodą, ale kampania pozwala zobaczyć dłuższy rozwój bohaterów i świata. Historia zwykle składa się ze scen, a sceny z decyzji graczy i reakcji świata. Drużyna może zmienić plan, ominąć walkę, zaprzyjaźnić się z kimś nieoczekiwanym albo stworzyć problem, którego nikt nie przewidział. To właśnie sprawia, że RPG jest żywe.",
      "dice-rolls":
        "Kości pomagają rozstrzygać niepewne sytuacje w sposób bezstronny i emocjonujący. Różne gry używają różnych kości: d4, d6, d8, d10, d12, d20, d100, kości Fate/Fudge albo specjalnych kości symbolicznych. Zapis 2d6+3 oznacza rzut dwiema sześciennymi kośćmi i dodanie 3 do wyniku. Same kości nie są jednak całą grą. System RPG określa, kiedy rzucać, jakie cechy dodawać, jak interpretować sukces, porażkę, obrażenia, strach, magię, śledztwo czy rozwój postaci. Dlatego D&D 5e, Call of Cthulhu, Warhammer, Pathfinder i Mork Borg mogą opowiadać podobne przygody, ale robią to innymi zasadami i innym klimatem.",
    },
  },
  {
    systemCode: "dnd5e",
    rulesApiCode: "dnd",
    name: "D&D 5e",
    legalStatus: "local-summary-with-attribution",
    legalNote:
      "Skrót oparty o ogólne zasady i treści dostępne w SRD/Basic Rules. Nie zawiera pełnego podręcznika.",
    sourcePolicy: "summary-with-attribution",
    sources: [
      { name: "D&D SRD 5.1 / 5.2", url: "https://www.dndbeyond.com/srd" },
      { name: "D&D Beyond Basic Rules", url: "https://www.dndbeyond.com/sources/basic-rules" },
    ],
    sections: {
      overview:
        "D&D 5e to heroic fantasy, w którym drużyna postaci eksploruje świat, rozwiązuje konflikty, walczy z przeciwnikami i rozwija się przez kolejne poziomy.",
      "core-test":
        "Podstawowy test to rzut d20 + odpowiedni modyfikator. Wynik porównuje się z poziomem trudności DC albo z Armor Class przeciwnika. Jeśli wynik jest równy lub wyższy, test zwykle kończy się sukcesem.",
      "character-creation":
        "Postać zwykle składa się z rasy/pochodzenia, klasy, tła, sześciu atrybutów, biegłości, ekwipunku i zaklęć, jeśli klasa ich używa.",
      combat:
        "Walka działa w rundach i turach. Kolejność ustala inicjatywa. W swojej turze postać zwykle może się poruszyć, wykonać akcję, czasem akcję bonusową i później reakcję poza swoją turą.",
      health:
        "Punkty życia określają wytrzymałość postaci. Armor Class określa trudność trafienia. Po spadku do 0 HP postać jest zagrożona śmiercią i używa mechaniki death saving throws, jeśli dana sytuacja tego wymaga.",
      progression:
        "Rozwój odbywa się przez poziomy. Postać zyskuje nowe cechy klasowe, większą wytrzymałość, lepsze możliwości walki, zaklęcia lub inne zdolności.",
      "game-flow":
        "Typowa sesja składa się z opisu sceny przez MG, deklaracji działań graczy, testów, konsekwencji, walki lub eksploracji, a potem rozwoju fabuły.",
    },
  },
  {
    systemCode: "cthulhu7e",
    rulesApiCode: "cthulhu",
    name: "Call of Cthulhu 7e",
    legalStatus: "local-summary-link-only",
    legalNote:
      "W aplikacji trzymamy tylko własne streszczenie i link do oficjalnego Quick-Start. Nie kopiujemy dużych fragmentów PDF.",
    sourcePolicy: "link-only",
    sources: [
      {
        name: "Chaosium Call of Cthulhu 7th Edition Quick-Start Rules",
        url: "https://www.chaosium.com/free-downloads/",
      },
    ],
    sections: {
      overview:
        "Call of Cthulhu 7e to gra śledczo-horrorowa, w której badacze odkrywają tajemnice, konfrontują się z zagrożeniami Mythosu i często ryzykują zdrowie psychiczne bardziej niż zwykłe obrażenia.",
      "core-test":
        "Podstawowa mechanika opiera się na rzucie k100. Umiejętności i cechy mają wartości procentowe. Test zwykle kończy się sukcesem, jeśli wynik jest równy lub niższy od odpowiedniej wartości.",
      "character-creation":
        "Postać jest badaczem. Ważne są cechy, umiejętności, profesja, motywacje, kontakty i zasoby. Postacie nie są superbohaterami, tylko ludźmi narażonymi na zjawiska, których nie rozumieją.",
      combat:
        "Walka jest niebezpieczna i często mniej korzystna niż ucieczka, negocjacje albo ostrożne działanie. System premiuje śledztwo i przetrwanie, nie ciągłe starcia.",
      health:
        "Istotne są punkty życia oraz Sanity. Utrata Sanity odzwierciedla kontakt z traumą, koszmarem i Mythosem. Psychiczne konsekwencje mogą być równie ważne jak obrażenia fizyczne.",
      progression:
        "Rozwój postaci zwykle wynika z używania umiejętności, doświadczeń fabularnych i konsekwencji śledztwa. Postać może stawać się skuteczniejsza, ale nie zmienia się w heroiczną jednostkę odporną na zagrożenia.",
      "game-flow":
        "Typowa sesja opiera się na zleceniu lub tajemnicy, zbieraniu tropów, rozmowach, analizie poszlak, odkrywaniu prawdy i konfrontacji z czymś groźnym albo niezrozumiałym.",
    },
  },
  {
    systemCode: "wfrp4e",
    rulesApiCode: "wh4e",
    name: "Warhammer 4e",
    legalStatus: "local-summary-link-only",
    legalNote:
      "Brak pełnego darmowego SRD do lokalnego przechowywania zasad. Aplikacja zawiera tylko własny ogólny skrót i linki do oficjalnych darmowych zasobów.",
    sourcePolicy: "link-only",
    sources: [
      { name: "Cubicle 7 WFRP Free Resources", url: "https://cubicle7games.com/en_EU/free-tabletop-roleplaying-games" },
      { name: "WFRP starter/startowe materiały", url: "https://cubicle7games.com/" },
    ],
    sections: {
      overview:
        "Warhammer Fantasy Roleplay 4e to mroczne, brutalne fantasy, w którym postacie są częścią niebezpiecznego świata pełnego korupcji, chorób, przemocy, Chaosu i społecznych napięć.",
      "core-test":
        "System używa testów procentowych. Rzut k100 porównuje się z odpowiednią cechą lub umiejętnością. Niższy wynik zwykle oznacza lepszy rezultat, a stopień sukcesu lub porażki może wpływać na jakość efektu.",
      "character-creation":
        "Postać określają cechy, umiejętności, talenty, rasa, profesja i kariera. Kariera ma duże znaczenie, bo opisuje miejsce postaci w świecie i kierunek jej rozwoju.",
      combat:
        "Walka jest ryzykowna, taktyczna i może prowadzić do poważnych konsekwencji. Znaczenie mają przewagi, pozycja, broń, pancerz, trafienia i efekty krytyczne.",
      health:
        "Postacie mogą otrzymywać rany, krytyki i długofalowe konsekwencje. Starcia są groźne, a obrażenia mogą zostawić trwały ślad.",
      progression:
        "Rozwój odbywa się przez karierę, wydawanie doświadczenia, rozwijanie cech, umiejętności i talentów. Postać może zmieniać ścieżki kariery.",
      "game-flow":
        "Typowa sesja łączy śledztwo, społeczne konflikty, podróże, walkę, zagrożenie Chaosem i trudne decyzje moralne.",
    },
  },
  {
    systemCode: "pf2e",
    rulesApiCode: "pf2e",
    name: "Pathfinder 2e",
    legalStatus: "local-summary-with-links",
    legalNote:
      "Najbezpieczniej linkować do Archives of Nethys i trzymać w aplikacji tylko własny skrót. Nie kopiować dużych baz danych bez pełnej weryfikacji licencji i atrybucji.",
    sourcePolicy: "summary-with-links",
    sources: [
      { name: "Archives of Nethys Pathfinder 2e", url: "https://2e.aonprd.com/" },
      { name: "Paizo Getting Started", url: "https://paizo.com/pathfinder/getstarted" },
    ],
    sections: {
      overview:
        "Pathfinder 2e to taktyczne fantasy oparte na precyzyjnych zasadach, rozwoju postaci przez poziomy i dużej liczbie wyborów mechanicznych.",
      "core-test":
        "Podstawowy test to rzut d20 + modyfikator przeciwko DC. System często rozróżnia cztery stopnie wyniku: critical success, success, failure i critical failure. Różnica 10 lub więcej od DC zwykle decyduje o krytycznym wyniku.",
      "character-creation":
        "Postać tworzy się przez wybór pochodzenia, dziedzictwa, tła, klasy, atrybutów, umiejętności i atutów. Duża część rozwoju opiera się na regularnych wyborach atutów.",
      combat:
        "Walka działa na systemie trzech akcji na turę. Postać może łączyć ruch, ataki, użycie przedmiotów, zaklęcia i inne aktywności. Reakcje są osobnym typem działania.",
      health:
        "Punkty życia określają wytrzymałość. Ważne są też pancerz, rzuty obronne, stany i efekty krytyczne. System mocno wykorzystuje warunki i precyzyjne modyfikatory.",
      progression:
        "Rozwój odbywa się poziomami. Postać otrzymuje nowe atuty, zdolności klasowe, zwiększenia umiejętności i kolejne opcje mechaniczne.",
      "game-flow":
        "Typowa sesja łączy eksplorację, encountery, testy umiejętności, walkę taktyczną i rozwój fabularny.",
    },
  },
  {
    systemCode: "morkborg",
    rulesApiCode: "morkborg",
    name: "Mork Borg",
    legalStatus: "local-summary-with-link",
    legalNote:
      "Bare Bones Edition jest darmowym źródłem referencyjnym, ale aplikacja nadal używa własnego skrótu i linku do źródła.",
    sourcePolicy: "summary-with-link",
    sources: [
      { name: "MORK BORG Bare Bones Edition", url: "https://jnohr.itch.io/mrk-borg-free" },
      { name: "Official MORK BORG site", url: "https://www.morkborg.com/" },
    ],
    sections: {
      overview:
        "Mork Borg to krótki, brutalny, apokaliptyczny system OSR, nastawiony na szybkie rozstrzygnięcia, śmierć, groteskę i ponury klimat końca świata.",
      "core-test":
        "Podstawą są proste rzuty k20 przeciwko trudności DR. Wiele sytuacji rozstrzygają szybkie testy, a zasady są celowo lekkie.",
      "character-creation":
        "Postacie są kruche, dziwne i często skazane na marny koniec. Tworzenie postaci jest szybkie, a duże znaczenie mają losowe elementy, ekwipunek i klimat.",
      combat:
        "Walka jest śmiertelna i szybka. Gracze często rzucają za swoje działania ofensywne i defensywne. Lepiej myśleć ostrożnie niż zakładać, że każda walka jest do wygrania.",
      health:
        "Postacie mają niewiele wytrzymałości, a obrażenia szybko stają się poważnym problemem. Śmierć lub trwałe konsekwencje są naturalną częścią gry.",
      progression:
        "Rozwój jest prosty i mniej rozbudowany niż w heroic fantasy. Ważniejszy jest klimat, przetrwanie i konsekwencje niż długie planowanie buildów.",
      "game-flow":
        "Typowa sesja to eksploracja, ryzyko, szybkie decyzje, dziwne znaleziska, brutalne starcia i narastające poczucie końca świata.",
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
