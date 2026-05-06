import { useMemo, useState } from "react";

const QUICK_CLASSES = [
  {
    name: "Barbarzynca",
    tagline: "Feralny wojownik",
    primary: "STR • CON",
    summary: "Mocny frontliner, ktory chce wejsc prosto w walke i przezyc najciezsze starcia.",
    learn: {
      title: "Jak gra sie Barbarzynca?",
      bullets: [
        "Wchodzisz pierwszy w zwarcie i trzymasz przeciwnikow przy sobie.",
        "Najlepiej dziala, gdy inwestujesz w Sile i Kondycje.",
        "To prosty, bardzo wybaczajacy wybor dla nowych graczy.",
      ],
    },
    hitDice: "1k12",
    hp: 14,
    ac: 14,
    speed: 30,
    initiative: 1,
    abilityPriority: ["strength", "constitution", "dexterity", "wisdom", "charisma", "intelligence"],
    featureNotes: "Szał, Obrona bez pancerza",
    equipmentNotes: "Topor dwureczny, oszczepy, plecak podróznika",
  },
  {
    name: "Bard",
    tagline: "Mistrz wsparcia",
    primary: "CHA • DEX",
    summary: "Wspiera druzyne magią, rozmową i elastycznymi pomysłami w każdej scenie.",
    learn: {
      title: "Jak gra sie Bardem?",
      bullets: [
        "Dobrze czujesz się w rozmowach, eksploracji i wsparciu drużyny.",
        "Najwazniejsza jest Charyzma, potem Zrecznosc lub Kondycja.",
        "To klasa dla gracza, który lubi mieć duzo opcji.",
      ],
    },
    hitDice: "1k8",
    hp: 10,
    ac: 14,
    speed: 30,
    initiative: 2,
    abilityPriority: ["charisma", "dexterity", "constitution", "wisdom", "intelligence", "strength"],
    featureNotes: "Inspiracja barda, Czarowanie",
    equipmentNotes: "Rapier, lutnia, skórzany pancerz, plecak artysty",
  },
  {
    name: "Kleryk",
    tagline: "Boskie wsparcie",
    primary: "WIS • CON",
    summary: "Łączy leczenie, wsparcie i solidną obecność przy stole oraz w walce.",
    learn: {
      title: "Jak gra sie Klerykiem?",
      bullets: [
        "Możesz leczyć, wzmacniać sojuszników i nadal być groźny w walce.",
        "Madrosc jest kluczowa, Kondycja i pancerz pomagają przeżyć.",
        "Świetna klasa dla kogoś, kto chce pomagać drużynie.",
      ],
    },
    hitDice: "1k8",
    hp: 11,
    ac: 16,
    speed: 30,
    initiative: 0,
    abilityPriority: ["wisdom", "constitution", "strength", "dexterity", "charisma", "intelligence"],
    featureNotes: "Boska domena, Czarowanie, Nieumarli precz",
    equipmentNotes: "Kolczuga lub kolczatka, tarcza, buzdygan, symbol swiety",
  },
  {
    name: "Druid",
    tagline: "Kapłan natury",
    primary: "WIS • CON",
    summary: "Kontroluje pole walki, wspiera naturą i ma bardzo wyrazisty klimat.",
    learn: {
      title: "Jak gra sie Druidem?",
      bullets: [
        "Dobrze działa w kontroli pola, leczeniu i utility.",
        "Najwazniejsza jest Madrosc, potem Kondycja i Zrecznosc.",
        "Świetny wybór, jeśli lubisz naturę i elastyczną magię.",
      ],
    },
    hitDice: "1k8",
    hp: 10,
    ac: 14,
    speed: 30,
    initiative: 1,
    abilityPriority: ["wisdom", "constitution", "dexterity", "intelligence", "charisma", "strength"],
    featureNotes: "Czarowanie, Dziki kształt",
    equipmentNotes: "Drewniana tarcza, laska, sierp, komponenty druidyczne",
  },
  {
    name: "Wojownik",
    tagline: "Mistrz broni",
    primary: "STR • CON",
    summary: "Najprostszy i najbardziej stabilny start dla gracza, który chce po prostu działać.",
    learn: {
      title: "Jak gra sie Wojownikiem?",
      bullets: [
        "Masz prostą turę, dobrą przeżywalność i wiele stylów walki.",
        "Wersja siłowa lub zręcznościowa działa dobrze od pierwszej sesji.",
        "To jeden z najłatwiejszych startów dla nowego gracza.",
      ],
    },
    hitDice: "1k10",
    hp: 12,
    ac: 17,
    speed: 30,
    initiative: 1,
    abilityPriority: ["strength", "constitution", "dexterity", "wisdom", "charisma", "intelligence"],
    featureNotes: "Second Wind, Styl walki",
    equipmentNotes: "Kolczuga, miecz długi, tarcza, kusza lekka",
  },
  {
    name: "Mnich",
    tagline: "Szybki sztukmistrz",
    primary: "DEX • WIS",
    summary: "Bardzo mobilny, szybki i efektowny, ale wymaga odrobiny wyczucia pozycji.",
    learn: {
      title: "Jak gra sie Mnichem?",
      bullets: [
        "Stawiasz na ruch, precyzję i uniki zamiast ciężkiego pancerza.",
        "Najwazniejsze są Zrecznosc i Madrosc.",
        "To dobry wybór, jeśli lubisz dynamiczny styl walki.",
      ],
    },
    hitDice: "1k8",
    hp: 10,
    ac: 15,
    speed: 35,
    initiative: 3,
    abilityPriority: ["dexterity", "wisdom", "constitution", "strength", "charisma", "intelligence"],
    featureNotes: "Sztuki walki, Obrona bez pancerza",
    equipmentNotes: "Krótki miecz, kij, strój podróżny",
  },
  {
    name: "Paladyn",
    tagline: "Rycerz przysięgi",
    primary: "STR • CHA",
    summary: "Łączy front, aurę bohatera i mocne uderzenia w ważnych przeciwników.",
    learn: {
      title: "Jak gra sie Paladynem?",
      bullets: [
        "Jesteś twardym frontlinerem z boskimi uderzeniami i aurą lidera.",
        "Najwazniejsza jest Sila, potem Charyzma i Kondycja.",
        "To bardzo wdzięczna klasa dla bohaterskiego archetypu.",
      ],
    },
    hitDice: "1k10",
    hp: 12,
    ac: 18,
    speed: 30,
    initiative: 0,
    abilityPriority: ["strength", "charisma", "constitution", "wisdom", "dexterity", "intelligence"],
    featureNotes: "Boski zmysł, Lay on Hands, Boskie smity",
    equipmentNotes: "Kolczuga, tarcza, miecz długi, symbol święty",
  },
  {
    name: "Lowca",
    tagline: "Łowca i zwiadowca",
    primary: "DEX • WIS",
    summary: "Strzela, tropi i dobrze radzi sobie poza walką w naturze oraz podróży.",
    learn: {
      title: "Jak gra sie Łowcą?",
      bullets: [
        "Dobrze czujesz się na dystans, w zwiadzie i eksploracji.",
        "Najwazniejsze są Zrecznosc i Madrosc.",
        "To wygodna, przystępna klasa dla klasycznego łucznika.",
      ],
    },
    hitDice: "1k10",
    hp: 11,
    ac: 15,
    speed: 30,
    initiative: 3,
    abilityPriority: ["dexterity", "wisdom", "constitution", "strength", "charisma", "intelligence"],
    featureNotes: "Favored Enemy, Natural Explorer",
    equipmentNotes: "Długi łuk, dwa krótkie miecze, skórznia ćwiekowana",
  },
  {
    name: "Lotrzyk",
    tagline: "Mistrz precyzji",
    primary: "DEX • INT",
    summary: "Szybki, sprytny i bardzo skuteczny, jeśli lubisz skradanie i precyzyjne akcje.",
    learn: {
      title: "Jak gra sie Łotrzykiem?",
      bullets: [
        "Zadajesz precyzyjne ciosy i grasz pozycją zamiast surową siłą.",
        "Najwazniejsza jest Zrecznosc, potem Kondycja lub Inteligencja.",
        "Świetny wybór dla gracza, który lubi spryt i skradanie.",
      ],
    },
    hitDice: "1k8",
    hp: 10,
    ac: 15,
    speed: 30,
    initiative: 4,
    abilityPriority: ["dexterity", "constitution", "intelligence", "wisdom", "charisma", "strength"],
    featureNotes: "Sneak Attack, Ekspertyza, Złodziejski żargon",
    equipmentNotes: "Rapier, krótki łuk, wytrychy, skórznia",
  },
  {
    name: "Czarownik",
    tagline: "Wrodzona magia",
    primary: "CHA • CON",
    summary: "Ma mniejszą listę zaklęć niż czarodziej, ale łatwiej zacząć nim grać.",
    learn: {
      title: "Jak gra sie Czarownikiem?",
      bullets: [
        "Opierasz się na kilku dobrze dobranych zaklęciach i mocnej Charyzmie.",
        "To lżejszy próg wejścia do grania casterem.",
        "Kondycja pomaga utrzymać koncentrację i przeżyć.",
      ],
    },
    hitDice: "1k6",
    hp: 8,
    ac: 13,
    speed: 30,
    initiative: 2,
    abilityPriority: ["charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength"],
    featureNotes: "Czarowanie, Metamagia",
    equipmentNotes: "Kusza lekka, komponenty, kostur lub sztylet",
  },
  {
    name: "Czarnoksieznik",
    tagline: "Paktobiorca",
    primary: "CHA • CON",
    summary: "Ma mocny klimat i prostszy loop gry oparty na kilku bardzo dobrych zdolnościach.",
    learn: {
      title: "Jak gra sie Czarnoksieżnikiem?",
      bullets: [
        "Masz niewiele slotów, ale mocne sztuczki i wyrazisty klimat patrona.",
        "Charyzma jest kluczowa, Kondycja pomaga utrzymać tempo.",
        "To klasa z bardzo czytelną tożsamością przy stole.",
      ],
    },
    hitDice: "1k8",
    hp: 10,
    ac: 13,
    speed: 30,
    initiative: 2,
    abilityPriority: ["charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength"],
    featureNotes: "Patron, Eldritch Blast, Inwokacje",
    equipmentNotes: "Lekka kusza, komponenty, skórznia, tajemny fokus",
  },
  {
    name: "Czarodziej",
    tagline: "Uczony mag",
    primary: "INT • CON",
    summary: "Najszerszy arsenał zaklęć i największa taktyczna swoboda, ale też więcej decyzji.",
    learn: {
      title: "Jak gra sie Czarodziejem?",
      bullets: [
        "Masz najwięcej opcji i bardzo szeroki wachlarz zaklęć.",
        "Inteligencja jest kluczowa, Kondycja pomaga nie paść od razu.",
        "Najlepszy dla gracza, który lubi planować i czytać możliwości.",
      ],
    },
    hitDice: "1k6",
    hp: 8,
    ac: 12,
    speed: 30,
    initiative: 2,
    abilityPriority: ["intelligence", "constitution", "dexterity", "wisdom", "charisma", "strength"],
    featureNotes: "Księga zaklęć, Arcane Recovery",
    equipmentNotes: "Kostur, komponenty, księga zaklęć",
  },
];

const QUICK_RACES = [
  {
    name: "Czlowiek",
    summary: "Uniwersalny start bez pułapek i bez zbędnych komplikacji.",
    subraces: ["Standardowy", "Wariantowy"],
    speed: 30,
    names: ["Marek", "Irena", "Tavian", "Elira"],
  },
  {
    name: "Elf",
    summary: "Zwinny, precyzyjny i naturalnie pasujący do zwiadu lub magii.",
    subraces: ["Wysoki elf", "Lesny elf", "Mroczny elf"],
    speed: 30,
    names: ["Aelar", "Lia", "Sylren", "Vaeris"],
  },
  {
    name: "Krasnolud",
    summary: "Twardy, wytrzymały i bardzo pewny w pierwszej kampanii.",
    subraces: ["Wzgorzowy krasnolud", "Gorski krasnolud"],
    speed: 25,
    names: ["Brom", "Dagna", "Torgrim", "Helja"],
  },
  {
    name: "Niziolek",
    summary: "Mały, sprytny i trudny do trafienia, świetny do lekkiego grania.",
    subraces: ["Lekkostopy", "Rosly"],
    speed: 25,
    names: ["Pip", "Mira", "Lorin", "Tessa"],
  },
  {
    name: "Gnom",
    summary: "Bystra i ciekawa świata postać z lekkim sznytem magii lub wynalazków.",
    subraces: ["Lesny gnom", "Skalny gnom"],
    speed: 25,
    names: ["Nim", "Bree", "Orrin", "Tinka"],
  },
  {
    name: "Polelf",
    summary: "Charyzmatyczny i elastyczny wybór do postaci społecznych lub mieszanych.",
    subraces: ["Brak podrasy"],
    speed: 30,
    names: ["Kael", "Selene", "Arius", "Neria"],
  },
  {
    name: "Polork",
    summary: "Mocny, prosty i bezpośredni archetyp do grania frontem.",
    subraces: ["Brak podrasy"],
    speed: 30,
    names: ["Grom", "Shura", "Morg", "Raka"],
  },
  {
    name: "Diabel",
    summary: "Mroczny klimat, wrodzona magia i bardzo wyrazisty wygląd.",
    subraces: ["Brak podrasy"],
    speed: 30,
    names: ["Zariel", "Ilyra", "Bael", "Nemeia"],
  },
  {
    name: "Dragonborn",
    summary: "Widowiskowy, honorowy i naturalnie heroiczny wybór.",
    subraces: ["Chromatyczny", "Metaliczny", "Klejnotowy"],
    speed: 30,
    names: ["Irylyassa", "Ballasar", "Rhogar", "Sorax"],
  },
];

const QUICK_BACKGROUNDS = [
  { name: "Akolita", summary: "Religia, rytuały i życie świątynne." },
  { name: "Banita", summary: "Dzicz, tropienie i życie poza cywilizacją." },
  { name: "Ludowy bohater", summary: "Prosty, bohaterski start blisko zwykłych ludzi." },
  { name: "Marynarz", summary: "Porty, podróże i klimat awanturniczy." },
  { name: "Przestepca", summary: "Ulica, skradanie i nielegalne kontakty." },
  { name: "Szlachcic", summary: "Etykieta, status i wejście w intrygi." },
  { name: "Wedrowiec", summary: "Droga, tropy i przygodowa niezależność." },
  { name: "Zolnierz", summary: "Dyscyplina, walka i praca w zespole." },
];

const RANDOM_NAMES = ["Morro", "Oremak", "Soors", "Umwin", "Lorilzin"];
const ABILITY_ORDER = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

function assignStandardArray(priority) {
  const result = {};
  priority.forEach((key, index) => {
    result[key] = STANDARD_ARRAY[index];
  });
  return result;
}

function createQuickCharacterPayload({ name, portraitUrl, classItem, raceItem, backgroundItem, subraceName }) {
  const stats = assignStandardArray(classItem.abilityPriority);
  return {
    name,
    status: "DRAFT",
    portraitUrl,
    raceName: raceItem.name,
    subraceName: subraceName || raceItem.subraces[0] || "",
    className: classItem.name,
    subclassName: classItem.name === "Lotrzyk" ? "Zlodziej" : "",
    backgroundName: backgroundItem.name,
    alignment: "Neutralny dobry",
    level: 1,
    experiencePoints: 0,
    abilityMode: "STANDARD_ARRAY",
    ...stats,
    maxHp: classItem.hp,
    currentHp: classItem.hp,
    tempHp: 0,
    armorClass: classItem.ac,
    initiativeBonus: classItem.initiative,
    speed: raceItem.speed || classItem.speed,
    proficiencyBonus: 2,
    hitDice: classItem.hitDice,
    skillNotes: `${classItem.name}: bazowy pakiet startowy pod szybką grę.`,
    savingThrowNotes: `Priorytet cech: ${classItem.primary}.`,
    equipmentNotes: classItem.equipmentNotes,
    featureNotes: classItem.featureNotes,
    personalityNotes: `${backgroundItem.name}. ${backgroundItem.summary}`,
    privateNotes: `Szybki kreator: ${classItem.name} / ${raceItem.name} / ${backgroundItem.name}.`,
  };
}

export default function QuickCharacterCreator({ onCreate, creating }) {
  const [selectedClass, setSelectedClass] = useState(QUICK_CLASSES[8]);
  const [selectedRace, setSelectedRace] = useState(QUICK_RACES[8]);
  const [selectedBackground, setSelectedBackground] = useState(QUICK_BACKGROUNDS[7]);
  const [selectedSubrace, setSelectedSubrace] = useState(QUICK_RACES[8].subraces[0]);
  const [name, setName] = useState("Irylyassa Telkendrad");
  const [portraitUrl, setPortraitUrl] = useState("");
  const [panel, setPanel] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const suggestedNames = useMemo(() => {
    if (!selectedRace) return RANDOM_NAMES;
    return [...selectedRace.names, ...RANDOM_NAMES].slice(0, 5);
  }, [selectedRace]);

  function applyRandomClass() {
    const next = QUICK_CLASSES[Math.floor(Math.random() * QUICK_CLASSES.length)];
    setSelectedClass(next);
  }

  function applyRandomRace() {
    const next = QUICK_RACES[Math.floor(Math.random() * QUICK_RACES.length)];
    setSelectedRace(next);
    setSelectedSubrace(next.subraces[0] || "");
  }

  function applyRandomBackground() {
    setSelectedBackground(QUICK_BACKGROUNDS[Math.floor(Math.random() * QUICK_BACKGROUNDS.length)]);
  }

  function applyRandomName() {
    const pool = suggestedNames.length ? suggestedNames : RANDOM_NAMES;
    setName(pool[Math.floor(Math.random() * pool.length)]);
  }

  function onPortraitUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPortraitUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  const cards = [
    {
      key: "class",
      title: "Class",
      label: selectedClass?.name || "Wybierz klasę",
      subtitle: selectedClass?.summary || "Wybierz podstawową rolę postaci.",
      action: () => setPanel("class"),
      random: applyRandomClass,
    },
    {
      key: "race",
      title: "Species",
      label: selectedRace?.name || "Wybierz rasę",
      subtitle: selectedRace?.summary || "Wybierz pochodzenie postaci.",
      action: () => setPanel("race"),
      random: applyRandomRace,
    },
    {
      key: "background",
      title: "Background",
      label: selectedBackground?.name || "Wybierz tło",
      subtitle: selectedBackground?.summary || "Wybierz, skąd postać się wzięła.",
      action: () => setPanel("background"),
      random: applyRandomBackground,
    },
  ];

  return (
    <div className="quickBuilderShell">
      <div className="quickBuilderHero">
        <div>
          <div className="charactersEyebrow">Ready, set</div>
          <h3>Start your story...</h3>
          <p>Wybierz klasę, rasę, tło, nazwę i portret. Szybki kreator ustawi gotowy, sensowny start pod wybraną klasę.</p>
        </div>
        <button
          type="button"
          className="quickBuilderCreateBtn"
          disabled={creating || !selectedClass || !selectedRace || !selectedBackground || !name.trim()}
          onClick={() => onCreate(createQuickCharacterPayload({
            name,
            portraitUrl,
            classItem: selectedClass,
            raceItem: selectedRace,
            backgroundItem: selectedBackground,
            subraceName: selectedSubrace,
          }))}
        >
          {creating ? "Tworzenie..." : "Create Character"}
        </button>
      </div>

      <div className="quickBuilderLayout">
        <div className="quickBuilderCards">
          {cards.map((card) => (
            <section key={card.key} className={`quickBuilderCard quickBuilderCard--${card.key}`}>
              <div className="quickBuilderCardShade" />
              <div className="quickBuilderCardBody">
                <div className="charactersEyebrow">Choose</div>
                <h4>{card.label}</h4>
                <p>{card.subtitle}</p>
              </div>
              <div className="quickBuilderCardActions">
                <button type="button" className="quickBuilderDiceBtn" onClick={card.random}>🎲</button>
                <button type="button" className="quickBuilderOutlineBtn" onClick={card.action}>See options</button>
              </div>
            </section>
          ))}
        </div>

        <aside className="quickBuilderPortrait">
          <div className="quickBuilderPortraitFrame">
            {portraitUrl ? <img src={portraitUrl} alt={name || "Portret"} className="quickBuilderPortraitImg" /> : <div className="quickBuilderPortraitPlaceholder">PORTRET</div>}
          </div>
          <label className="quickBuilderUploadBtn">
            <input type="file" accept="image/*" onChange={onPortraitUpload} />
            Choose Portrait
          </label>
          <div className="quickBuilderNameBox">
            <button type="button" className="quickBuilderMiniDice" onClick={applyRandomName}>🎲</button>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Choose a Name" />
          </div>
          <div className="quickBuilderSuggestions">
            {suggestedNames.map((suggested) => (
              <button key={suggested} type="button" className="quickBuilderSuggestion" onClick={() => setName(suggested)}>
                {suggested}
              </button>
            ))}
          </div>
          {selectedRace?.subraces?.length > 1 && (
            <div className="quickBuilderSubraceBox">
              <span>Podrasa</span>
              <select value={selectedSubrace} onChange={(event) => setSelectedSubrace(event.target.value)}>
                {selectedRace.subraces.map((subrace) => <option key={subrace} value={subrace}>{subrace}</option>)}
              </select>
            </div>
          )}
        </aside>
      </div>

      {panel && (
        <div className="quickBuilderPicker">
          <div className="quickBuilderPickerHead">
            <div>
              <div className="charactersEyebrow">{panel === "class" ? "Choose a class" : panel === "race" ? "Choose a species" : "Choose a background"}</div>
              <h4>{panel === "class" ? "Claim your role" : panel === "race" ? "What's your lineage?" : "Where did you come from?"}</h4>
            </div>
            <button type="button" className="charactersGhostBtn" onClick={() => setPanel(null)}>Zamknij</button>
          </div>

          {panel === "class" && (
            <div className="quickBuilderOptionGrid">
              {QUICK_CLASSES.map((item) => (
                <article key={item.name} className="quickBuilderOptionCard quickBuilderOptionCard--class">
                  <div className="quickBuilderOptionContent">
                    <div className="charactersEyebrow">5E</div>
                    <h5>{item.name}</h5>
                    <div className="quickBuilderTags">
                      <span>{item.tagline}</span>
                      <span>{item.primary}</span>
                    </div>
                    <p>{item.summary}</p>
                  </div>
                  <div className="quickBuilderOptionActions">
                    <button type="button" className="quickBuilderGhostPill" onClick={() => setDetailItem({ type: "class", item })}>Learn more</button>
                    <button type="button" className="quickBuilderSelectPill" onClick={() => { setSelectedClass(item); setPanel(null); }}>Select</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {panel === "race" && (
            <div className="quickBuilderOptionGrid">
              {QUICK_RACES.map((item) => (
                <article key={item.name} className="quickBuilderOptionCard quickBuilderOptionCard--race">
                  <div className="quickBuilderOptionContent">
                    <div className="charactersEyebrow">Species</div>
                    <h5>{item.name}</h5>
                    <p>{item.summary}</p>
                  </div>
                  <div className="quickBuilderOptionActions">
                    <button type="button" className="quickBuilderGhostPill" onClick={() => setDetailItem({ type: "race", item })}>
                      {item.subraces.length > 1 ? `Lista (${item.subraces.length})` : "Details"}
                    </button>
                    <button type="button" className="quickBuilderSelectPill" onClick={() => { setSelectedRace(item); setSelectedSubrace(item.subraces[0] || ""); setPanel(null); }}>Select</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {panel === "background" && (
            <div className="quickBuilderOptionGrid quickBuilderOptionGrid--compact">
              {QUICK_BACKGROUNDS.map((item) => (
                <article key={item.name} className="quickBuilderOptionCard quickBuilderOptionCard--background">
                  <div className="quickBuilderOptionContent">
                    <div className="charactersEyebrow">Background</div>
                    <h5>{item.name}</h5>
                    <p>{item.summary}</p>
                  </div>
                  <div className="quickBuilderOptionActions">
                    <button type="button" className="quickBuilderSelectPill" onClick={() => { setSelectedBackground(item); setPanel(null); }}>Select</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {detailItem && (
        <div className="quickBuilderDetail">
          <div className="quickBuilderPickerHead">
            <div>
              <div className="charactersEyebrow">{detailItem.type === "class" ? "Learn more" : "Details"}</div>
              <h4>{detailItem.item.name}</h4>
            </div>
            <button type="button" className="charactersGhostBtn" onClick={() => setDetailItem(null)}>Zamknij</button>
          </div>
          {detailItem.type === "class" ? (
            <div className="quickBuilderDetailContent">
              <p>{detailItem.item.summary}</p>
              <strong>{detailItem.item.learn.title}</strong>
              <ul>
                {detailItem.item.learn.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
              <div className="quickBuilderTags">
                <span>{detailItem.item.primary}</span>
                <span>{detailItem.item.hitDice}</span>
              </div>
            </div>
          ) : (
            <div className="quickBuilderDetailContent">
              <p>{detailItem.item.summary}</p>
              <strong>Dostępne podrasy</strong>
              <div className="quickBuilderSubraceList">
                {detailItem.item.subraces.map((subrace) => (
                  <button
                    key={subrace}
                    type="button"
                    className={`quickBuilderSubraceItem${selectedRace?.name === detailItem.item.name && selectedSubrace === subrace ? " is-active" : ""}`}
                    onClick={() => {
                      setSelectedRace(detailItem.item);
                      setSelectedSubrace(subrace);
                      setDetailItem(null);
                      setPanel(null);
                    }}
                  >
                    {subrace}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
