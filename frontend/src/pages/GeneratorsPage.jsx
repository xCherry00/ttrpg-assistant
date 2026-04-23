import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getGeneratorPool } from "../api/generators";

const RECENT_GENERATIONS_KEY = "ttrpg_recent_generations_v1";

const GAME_SYSTEMS = [
  "D&D 5E",
  "Call of Cthulhu 7E",
  "Warhammer 4E",
  "Pathfinder 2E",
  "Mork Borg",
];

const GENERATORS = [
  {
    id: "npc",
    label: "NPC",
    sideLabel: "Postacie i ludzie",
    title: "Generator NPC",
    subtitle: "Ożyw swój świat wyjątkowymi postaciami",
    accent: "#39c7ff",
    accentRgb: "57, 199, 255",
    buttonLabel: "Generuj NPC",
    hasOptional: true,
    baseFields: [
      { key: "gender", label: "Płeć", type: "select", options: ["Mężczyzna", "Kobieta", "Niebinarna"] },
      { key: "age", label: "Wiek", type: "select", options: ["Dziecko", "Młody dorosły", "Dorosły", "Starszy"] },
      { key: "level", label: "Poziom", type: "number", min: 1, max: 20 },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
    ],
    optionalFields: [
      { key: "quickDescription", label: "Krótki opis (Opcjonalnie)", type: "textarea", placeholder: "Opisz NPC, którego chcesz wygenerować..." },
      { key: "race", label: "Rasa (Opcjonalnie)", type: "select", options: ["Wybierz rasę", "Człowiek", "Elf", "Krasnolud", "Tiefling", "Ork", "Niziołek"] },
      { key: "class", label: "Klasa (Opcjonalnie)", type: "select", options: ["Wybierz klasę", "Wojownik", "Czarodziej", "Łotr", "Kleryk", "Bard", "Łowca"] },
      { key: "occupation", label: "Profesja (Opcjonalnie)", type: "text", placeholder: "np. Kowal, Kupiec, Strażnik" },
      { key: "additionalDetails", label: "Dodatkowe szczegóły (Opcjonalnie)", type: "textarea", placeholder: "Dodaj konkretne szczegóły dla tego NPC..." },
    ],
  },
  {
    id: "monster",
    label: "Potwór",
    sideLabel: "Stwory i bestie",
    title: "Generator Potwora",
    subtitle: "Twórz groźne spotkania dla drużyny",
    accent: "#ff6c78",
    accentRgb: "255, 108, 120",
    buttonLabel: "Generuj potwora",
    hasOptional: true,
    baseFields: [
      { key: "quickDescription", label: "Krótki opis (Opcjonalnie)", type: "textarea", placeholder: "Opisz potwora, którego chcesz wygenerować..." },
      { key: "challengeRating", label: "Poziom wyzwania", type: "number", min: 0, max: 30 },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
    ],
    optionalFields: [
      { key: "monsterType", label: "Typ potwora (Opcjonalnie)", type: "select", options: ["Wybierz typ potwora", "Aberracja", "Bestia", "Konstrukt", "Smok", "Nieumarły"] },
      { key: "combatRole", label: "Rola bojowa (Opcjonalnie)", type: "select", options: ["Wybierz rolę bojową", "Bruiser", "Kontroler", "Striker", "Wsparcie"] },
      { key: "size", label: "Rozmiar (Opcjonalnie)", type: "select", options: ["Wybierz rozmiar", "Malutki", "Mały", "Średni", "Duży", "Ogromny"] },
      { key: "environment", label: "Środowisko (Opcjonalnie)", type: "select", options: ["Wybierz środowisko", "Las", "Jaskinia", "Bagno", "Miasto", "Arktyka"] },
      { key: "partyLevel", label: "Poziom drużyny (Opcjonalnie)", type: "number", min: 1, max: 20 },
      { key: "difficulty", label: "Trudność (Opcjonalnie)", type: "select", options: ["Wybierz trudność", "Łatwa", "Średnia", "Trudna", "Zabójcza"] },
      { key: "reskinOf", label: "Reskin na bazie (Opcjonalnie)", type: "text", placeholder: "np. Sowo-niedźwiedź, Beholder, Smok" },
      { key: "additionalDetails", label: "Dodatkowe szczegóły (Opcjonalnie)", type: "textarea", placeholder: "Dodaj szczegóły o umiejętnościach, lore lub zachowaniu..." },
    ],
  },
  {
    id: "shop",
    label: "Sklep",
    sideLabel: "Kupcy i towary",
    title: "Generator Sklepu",
    subtitle: "Wyposaż kupców w unikalne towary",
    accent: "#34d399",
    accentRgb: "52, 211, 153",
    buttonLabel: "Generuj sklep",
    baseFields: [
      { key: "shopType", label: "Typ sklepu", type: "select", options: ["Sklep ogólny", "Kowal", "Sklep magiczny", "Alchemik", "Wędrowny kupiec"] },
      { key: "partyLevel", label: "Poziom drużyny", type: "number", min: 1, max: 20 },
      { key: "theme", label: "Motyw (Opcjonalnie)", type: "text", placeholder: "np. krasnoludzki, elficki, magiczny..." },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "extraDetails", label: "Dodatkowe wymagania (Opcjonalnie)", type: "textarea", placeholder: "Specjalne wymagania lub szczegóły..." },
    ],
  },
  {
    id: "tavern",
    label: "Karczma",
    sideLabel: "Karczmy i gospody",
    title: "Generator Karczmy",
    subtitle: "Twórz niezapomniane miejsca spotkań",
    accent: "#f2bf3a",
    accentRgb: "242, 191, 58",
    buttonLabel: "Generuj karczmę",
    baseFields: [
      { key: "tavernType", label: "Typ karczmy", type: "select", options: ["Przytulna gospoda", "Karczma przydrożna", "Salon szlachecki", "Portowa gospoda"] },
      { key: "partyLevel", label: "Poziom drużyny", type: "number", min: 1, max: 20 },
      { key: "theme", label: "Motyw", type: "select", options: ["Średniowieczny", "Piracki", "Pogranicze", "Arkana"] },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "extraDetails", label: "Dodatkowe wymagania (Opcjonalnie)", type: "textarea", placeholder: "Dodaj konkretne szczegóły lub wymagania dla karczmy..." },
    ],
  },
  {
    id: "faction",
    label: "Frakcja",
    sideLabel: "Gildie i zakony",
    title: "Generator Frakcji",
    subtitle: "Twórz sojusze i rywalizacje",
    accent: "#ef6f9a",
    accentRgb: "239, 111, 154",
    buttonLabel: "Generuj frakcję",
    baseFields: [
      { key: "quickDescription", label: "Krótki opis (Opcjonalnie)", type: "textarea", placeholder: "Tajna gildia złodziei działająca z cienia..." },
      { key: "factionType", label: "Typ frakcji (Opcjonalnie)", type: "select", options: ["Wybierz typ frakcji", "Gildia", "Kult", "Zakon wojskowy", "Syndykat kupiecki"] },
      { key: "alignment", label: "Charakter (Opcjonalnie)", type: "select", options: ["Wybierz charakter", "Praworządny dobry", "Neutralny", "Chaotyczny neutralny", "Praworządny zły"] },
      { key: "size", label: "Rozmiar (Opcjonalnie)", type: "select", options: ["Wybierz rozmiar", "Mały", "Średni", "Duży", "Ogromny"] },
      { key: "influence", label: "Sfera wpływów (Opcjonalnie)", type: "select", options: ["Wybierz poziom wpływów", "Lokalny", "Regionalny", "Królewski", "Globalny"] },
      { key: "theme", label: "Motyw (Opcjonalnie)", type: "text", placeholder: "np. steampunkowi wynalazcy, skrytobójcy z cienia" },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "additionalInstructions", label: "Dodatkowe instrukcje (Opcjonalnie)", type: "textarea", placeholder: "Specjalne wymagania lub szczegóły..." },
    ],
  },
  {
    id: "loot",
    label: "Łup",
    sideLabel: "Skarby i nagrody",
    title: "Generator Łupu",
    subtitle: "Nagródź odważnych odpowiednimi skarbami",
    accent: "#b98cff",
    accentRgb: "185, 140, 255",
    buttonLabel: "Generuj łup",
    baseFields: [
      { key: "partyLevel", label: "Poziom drużyny", type: "number", min: 1, max: 20 },
      { key: "lootTheme", label: "Motyw łupu", type: "select", options: ["Podziemie", "Szlachta", "Religijny", "Dzicz", "Arkana"] },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "monstersFought", label: "Pokonane potwory (Opcjonalnie)", type: "textarea", placeholder: "Wpisz pokonane potwory (jeden na linię)..." },
    ],
  },
  {
    id: "settlement",
    label: "Osada",
    sideLabel: "Miasteczka i miasta",
    title: "Generator Osady",
    subtitle: "Twórz tętniące życiem społeczności i miasta",
    accent: "#9ba7ff",
    accentRgb: "155, 167, 255",
    buttonLabel: "Generuj osadę",
    baseFields: [
      { key: "settlementType", label: "Typ osady", type: "select", options: ["Wieś (200-1,000)", "Miasteczko (1,000-5,000)", "Miasto (5,000-25,000)"] },
      { key: "populationSize", label: "Wielkość populacji", type: "select", options: ["Mała (50-200)", "Średnia (200-1,000)", "Duża (1,000-10,000)"] },
      { key: "locationType", label: "Typ lokalizacji", type: "select", options: ["Rozdroża", "Wybrzeże", "Góry", "Dolina rzeczna"] },
      { key: "theme", label: "Motyw", type: "select", options: ["Średniowieczne fantasy", "Centrum handlu", "Centrum religijne", "Placówka graniczna"] },
      { key: "partyLevel", label: "Poziom drużyny", type: "number", min: 1, max: 20 },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "additionalDetails", label: "Dodatkowe szczegóły (Opcjonalnie)", type: "textarea", placeholder: "Dodaj szczegóły o kulturze, cechach szczególnych lub wymaganiach..." },
    ],
  },
  {
    id: "region",
    label: "Region",
    sideLabel: "Krainy i królestwa",
    title: "Generator Regionu",
    subtitle: "Mapuj niezbadane tereny i krainy",
    accent: "#2dd4bf",
    accentRgb: "45, 212, 191",
    buttonLabel: "Generuj region",
    baseFields: [
      { key: "regionName", label: "Nazwa regionu (Opcjonalnie)", type: "text", placeholder: "np. Szare Marchie" },
      { key: "regionType", label: "Typ regionu", type: "select", options: ["Pogranicze", "Królestwo", "Pustkowie", "Dzikie ziemie"] },
      { key: "climate", label: "Klimat", type: "select", options: ["Umiarkowany", "Suchy", "Tropikalny", "Arktyczny"] },
      { key: "terrain", label: "Teren", type: "select", options: ["Równiny", "Góry", "Las", "Bagna", "Pustynia"] },
      { key: "scale", label: "Skala", type: "select", options: ["Lokalna (10-50 mil)", "Regionalna (50-150 mil)", "Kontynentalna (150+ mil)"] },
      { key: "dominantCulture", label: "Dominująca kultura (Opcjonalnie)", type: "text", placeholder: "np. kupcy nadmorscy, klany nomadów" },
      { key: "magicLevel", label: "Poziom magii", type: "select", options: ["Rzadka", "Powszechna", "Wysoka", "Mityczna"] },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "additionalDetails", label: "Dodatkowe szczegóły (Opcjonalnie)", type: "textarea", placeholder: "Dodaj ograniczenia, motywy lub punkty orientacyjne..." },
    ],
  },
  {
    id: "poetry",
    label: "Poezja i lore",
    sideLabel: "Wersy i proroctwa",
    title: "Generator Poezji i Lore",
    subtitle: "Tkaj słowa mocy i cudów",
    accent: "#d48cff",
    accentRgb: "212, 140, 255",
    buttonLabel: "Generuj poezję",
    baseFields: [
      { key: "contentType", label: "Typ treści", type: "select", options: ["Proroctwo", "Hymn", "Pieśń bojowa", "Fragment legendy"] },
      { key: "theme", label: "Motyw", type: "select", options: ["Magia i tajemnica", "Wojna i honor", "Miłość i strata", "Starożytne ruiny"] },
      { key: "mood", label: "Nastrój", type: "select", options: ["Tajemniczy", "Epicki", "Melancholijny", "Pełen nadziei"] },
      { key: "length", label: "Długość", type: "select", options: ["Krótka (4-8 wersów)", "Średnia (12-20 wersów)", "Długa (24+ wersy)"] },
      { key: "specificWords", label: "Wybrane słowa (Opcjonalnie)", type: "text", placeholder: "Wpisz słowa do uwzględnienia, rozdzielone przecinkami" },
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "additionalDetails", label: "Dodatkowe szczegóły (Opcjonalnie)", type: "textarea", placeholder: "Preferencje stylu lub kontekst..." },
    ],
  },
  {
    id: "spellbook",
    label: "Księga zaklęć",
    sideLabel: "Zaklęcia i arkana",
    title: "Generator Księgi Zaklęć",
    subtitle: "Twórz tajemną wiedzę i zbiory zaklęć",
    accent: "#ad96ff",
    accentRgb: "173, 150, 255",
    buttonLabel: "Generuj księgę zaklęć",
    baseFields: [
      { key: "gameSystem", label: "System gry", type: "select", options: GAME_SYSTEMS },
      { key: "spellcasterArchetype", label: "Archetyp czarującego", type: "select", options: ["Czarodziej", "Zaklinacz", "Czarnoksiężnik", "Kleryk", "Druid"] },
      { key: "casterLevel", label: "Poziom czarującego", type: "number", min: 1, max: 20 },
      { key: "spellbookTheme", label: "Motyw księgi zaklęć", type: "select", options: ["Arkana", "Żywioły", "Nekromancja", "Boskość"] },
      { key: "additionalInstructions", label: "Dodatkowe instrukcje (Opcjonalnie)", type: "textarea", placeholder: "Podaj charakterystyczne zaklęcia, ograniczenia lub specjalizacje..." },
    ],
  },
  {
    id: "dungeon",
    label: "Podziemie",
    sideLabel: "Podziemia i leża",
    title: "Generator Podziemi",
    subtitle: "Twórz niebezpieczne labirynty dla drużyny",
    accent: "#f0be3c",
    accentRgb: "240, 190, 60",
    buttonLabel: "Generuj podziemie",
    hasOptional: true,
    baseFields: [
      { key: "dungeonSize", label: "Rozmiar podziemia", type: "select", options: ["Małe (5-10 pomieszczeń)", "Średnie (10-15 pomieszczeń)", "Duże (15-25 pomieszczeń)"] },
      { key: "exactRoomCount", label: "Dokładna liczba pomieszczeń (Opcjonalnie)", type: "number", min: 1, max: 100 },
      { key: "theme", label: "Motyw", type: "select", options: ["Krypta", "Starożytne ruiny", "Wulkaniczne leże", "Laboratorium magiczne"] },
      { key: "difficulty", label: "Trudność", type: "select", options: ["Łatwa", "Średnia", "Trudna", "Zabójcza"] },
      { key: "partyLevel", label: "Poziom drużyny", type: "number", min: 1, max: 20 },
    ],
    optionalFields: [
      { key: "monsterTypes", label: "Typy potworów", type: "text", placeholder: "np. nieumarli, konstrukty, aberracje" },
      { key: "lootRarity", label: "Rzadkość łupu", type: "select", options: ["Dowolna", "Pospolita", "Niepospolita", "Rzadka", "Legendarna"] },
      { key: "trapDensity", label: "Gęstość pułapek", type: "select", options: ["Niska", "Domyślna", "Wysoka"] },
      { key: "additionalDetails", label: "Dodatkowe szczegóły", type: "textarea", placeholder: "Wymagania specjalne - haczyki fabularne, starcia z bossem..." },
    ],
  },
];

function pickRandom(arr) {
  if (!Array.isArray(arr) || !arr.length) return "Brak";
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildInitialState() {
  const state = {};
  for (const generator of GENERATORS) {
    const allFields = [...generator.baseFields, ...(generator.optionalFields || [])];
    state[generator.id] = allFields.reduce((acc, field) => {
      if (field.type === "select") {
        acc[field.key] = field.options[0] || "";
      } else if (field.type === "number") {
        acc[field.key] = field.key.toLowerCase().includes("level") ? "5" : "";
      } else {
        acc[field.key] = "";
      }
      return acc;
    }, {});

    if (state[generator.id].gameSystem === "") state[generator.id].gameSystem = "D&D 5E";
    if (generator.id === "npc") state[generator.id].level = "5";
    if (generator.id === "monster") state[generator.id].challengeRating = "5";
    if (generator.id === "loot") state[generator.id].partyLevel = "5";
    if (generator.id === "settlement") state[generator.id].partyLevel = "5";
    if (generator.id === "spellbook") state[generator.id].casterLevel = "5";
    if (generator.id === "dungeon") state[generator.id].partyLevel = "5";
  }
  return state;
}

function renderValue(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "Nie podano";
  return String(value);
}

function buildSummary(definition, values) {
  const payload = {};
  const fields = [...definition.baseFields, ...(definition.optionalFields || [])];
  for (const field of fields) {
    if (!values[field.key]) continue;
    payload[field.label.replace(" (Opcjonalnie)", "")] = values[field.key];
  }

  if (!Object.keys(payload).length) {
    payload.Uwaga = "Brak dodatkowych szczegółów. Wygenerowano z ustawieniami domyślnymi.";
  }

  return payload;
}

function getUserIdFromToken(token) {
  if (!token || typeof window === "undefined") return "";

  try {
    const [, payload] = token.split(".");
    if (!payload) return "";

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalized);
    const json = JSON.parse(decoded);
    return String(json.sub ?? json.userId ?? json.id ?? "");
  } catch {
    return "";
  }
}

function saveRecentGeneration(entry, userId) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(RECENT_GENERATIONS_KEY);
    const parsed = JSON.parse(raw || "[]");
    const list = Array.isArray(parsed) ? parsed : [];
    const next = [
      {
        ...entry,
        userId: String(userId || ""),
      },
      ...list,
    ].slice(0, 12);
    window.localStorage.setItem(RECENT_GENERATIONS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors - generator result should still be visible on the page.
  }
}

function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function Field({ field, activeGenerator, activeValues, setFieldValue }) {
  const value = activeValues[field.key] ?? "";

  if (field.type === "textarea") {
    return (
      <div className="generatorField generatorFieldWide">
        <label className="generatorLabel">{field.label}</label>
        <textarea
          className="generatorInput generatorTextarea"
          rows={4}
          value={value}
          placeholder={field.placeholder || ""}
          onChange={(event) => setFieldValue(activeGenerator, field.key, event.target.value)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="generatorField">
        <label className="generatorLabel">{field.label}</label>
        <select
          className="generatorInput"
          value={value}
          onChange={(event) => setFieldValue(activeGenerator, field.key, event.target.value)}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="generatorField">
      <label className="generatorLabel">{field.label}</label>
      <input
        className="generatorInput"
        type={field.type || "text"}
        min={field.min}
        max={field.max}
        value={value}
        placeholder={field.placeholder || ""}
        onChange={(event) => setFieldValue(activeGenerator, field.key, event.target.value)}
      />
    </div>
  );
}

function GeneratorIcon({ type }) {
  if (type === "npc") {
    return (
      <IconBase>
        <circle cx="9" cy="8" r="3" />
        <path d="M4 19a5 5 0 0 1 10 0" />
        <circle cx="17" cy="10" r="2" />
      </IconBase>
    );
  }

  if (type === "monster") {
    return (
      <IconBase>
        <path d="M7 7h10v10H7z" />
        <path d="m9 9 2 2m4-2-2 2m-4 3h6" />
      </IconBase>
    );
  }

  if (type === "shop") {
    return (
      <IconBase>
        <path d="M3 9h18l-1.5 3h-15z" />
        <path d="M5 12v7h14v-7" />
      </IconBase>
    );
  }

  if (type === "tavern") {
    return (
      <IconBase>
        <path d="M6 4h12" />
        <path d="M8 4v10a4 4 0 0 0 8 0V4" />
      </IconBase>
    );
  }

  if (type === "faction") {
    return (
      <IconBase>
        <path d="M12 3 6 6v6c0 5 3 8 6 9 3-1 6-4 6-9V6z" />
      </IconBase>
    );
  }

  if (type === "loot") {
    return (
      <IconBase>
        <path d="M4 8h16v10H4z" />
        <path d="M9 8V6a3 3 0 1 1 6 0v2" />
      </IconBase>
    );
  }

  if (type === "settlement") {
    return (
      <IconBase>
        <path d="M4 20v-7l8-6 8 6v7" />
        <path d="M9 20v-4h6v4" />
      </IconBase>
    );
  }

  if (type === "region") {
    return (
      <IconBase>
        <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </IconBase>
    );
  }

  if (type === "poetry") {
    return (
      <IconBase>
        <path d="M5 19c6 0 6-14 12-14" />
        <path d="M8 19h8" />
      </IconBase>
    );
  }

  if (type === "spellbook") {
    return (
      <IconBase>
        <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z" />
        <path d="M8 4v14" />
      </IconBase>
    );
  }

  return (
    <IconBase>
      <path d="M4 20h16V6H4z" />
      <path d="M8 6V4m8 2V4" />
    </IconBase>
  );
}

export default function GeneratorsPage() {
  const { token } = useAuth();
  const [activeGenerator, setActiveGenerator] = useState("npc");
  const [forms, setForms] = useState(() => buildInitialState());
  const [openOptional, setOpenOptional] = useState({ npc: false, monster: true, dungeon: true });
  const [result, setResult] = useState(null);
  const [resultIsNew, setResultIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeDefinition = useMemo(
    () => GENERATORS.find((generator) => generator.id === activeGenerator) || GENERATORS[0],
    [activeGenerator]
  );
  const currentUserId = useMemo(() => getUserIdFromToken(token), [token]);

  const activeValues = forms[activeGenerator] || {};

  function setFieldValue(generatorId, key, value) {
    setForms((prev) => ({
      ...prev,
      [generatorId]: {
        ...(prev[generatorId] || {}),
        [key]: value,
      },
    }));
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let generatedResult = null;

      if (activeGenerator === "npc") {
        const pool = await getGeneratorPool(token, "npc", "dnd");
        const data = pool?.data || {};
        const npc = {
          Imie: pickRandom(data.names),
          Archetyp: pickRandom(data.archetypes),
          Cecha: pickRandom(data.traits),
          Motywacja: pickRandom(data.motives),
          Sekret: `${pickRandom(data.traits)}, ale ${pickRandom(data.motives)}`,
        };
        generatedResult = { title: "Wygenerowany NPC", payload: npc };
      } else if (activeGenerator === "loot") {
        const pool = await getGeneratorPool(token, "item", "dnd");
        const data = pool?.data || {};
        const item = {
          Nazwa: pickRandom(data.names),
          Typ: pickRandom(data.types),
          Rzadkosc: pickRandom(["Pospolita", "Niepospolita", "Rzadka", "Bardzo rzadka"]),
          Efekt: pickRandom(data.effects),
          Koszt: `${pickRandom([25, 40, 60, 90, 130])} sz`,
        };
        generatedResult = { title: "Wygenerowany przedmiot", payload: item };
      } else {
        const payload = buildSummary(activeDefinition, activeValues);
        generatedResult = { title: `${activeDefinition.title} - wynik`, payload };
      }

      if (generatedResult) {
        setResult(generatedResult);
        setResultIsNew(true);
        setTimeout(() => setResultIsNew(false), 600);
        saveRecentGeneration({
          id: activeGenerator,
          title: generatedResult.title,
          payload: generatedResult.payload,
          createdAt: new Date().toISOString(),
        }, currentUserId);
      }
    } catch (e) {
      setError(e?.message || "Nie udało się wygenerować treści.");
    } finally {
      setLoading(false);
    }
  }

  function copyResultToClipboard() {
    if (!result) return;
    const text = Object.entries(result.payload)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    navigator.clipboard.writeText(text).catch(() => {
      alert("Nie udało się skopiować do schowka");
    });
  }

  function handleRegenerate() {
    handleGenerate();
  }

  return (
    <div className="page generatorsPage">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Generatory</h1>
          <p className="pageSubtitle">
            Wybierz generator i stwórz materiały do sesji w tym samym stylu co reszta aplikacji.
          </p>
        </div>
      </div>

      <div className="generatorsLayout">
        <aside className="generatorNav">
          {GENERATORS.map((generator) => {
            const isActive = generator.id === activeGenerator;
            return (
              <button
                key={generator.id}
                type="button"
                className={`generatorNavItem${isActive ? " isActive" : ""}`}
                style={{ "--accent": generator.accent, "--accent-rgb": generator.accentRgb }}
                onClick={() => {
                  setActiveGenerator(generator.id);
                  setError("");
                  setResult(null);
                }}
              >
                <span className="generatorNavIcon">
                  <GeneratorIcon type={generator.id} />
                </span>
                <span className="generatorNavText">
                  <span className="generatorNavTitle">{generator.label}</span>
                  <span className="generatorNavHint">{generator.sideLabel}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <section className="generatorPanel" style={{ "--accent": activeDefinition.accent, "--accent-rgb": activeDefinition.accentRgb }}>
          <header className="generatorPanelHeader">
            <div className="generatorBadge">
              <GeneratorIcon type={activeDefinition.id} />
            </div>
            <div>
              <h2 className="generatorPanelTitle">{activeDefinition.title}</h2>
              <p className="generatorPanelSubtitle">{activeDefinition.subtitle}</p>
            </div>
          </header>

          <div className="generatorForm">
            <div className="generatorGrid">
              {activeDefinition.baseFields.map((field) => (
                <Field key={field.key} field={field} activeGenerator={activeGenerator} activeValues={activeValues} setFieldValue={setFieldValue} />
              ))}
            </div>

            {activeDefinition.hasOptional && (
              <button
                type="button"
                className="generatorOptionalToggle"
                onClick={() =>
                  setOpenOptional((prev) => ({
                    ...prev,
                    [activeDefinition.id]: !prev[activeDefinition.id],
                  }))
                }
              >
                {openOptional[activeDefinition.id] ? "Ukryj ustawienia opcjonalne" : "Pokaż ustawienia opcjonalne"}
              </button>
            )}

            {(!activeDefinition.hasOptional || openOptional[activeDefinition.id]) &&
              Boolean(activeDefinition.optionalFields?.length) && (
                <div className="generatorGrid">
                  {activeDefinition.optionalFields.map((field) => (
                    <Field key={field.key} field={field} activeGenerator={activeGenerator} activeValues={activeValues} setFieldValue={setFieldValue} />
                  ))}
                </div>
              )}

            {error && <div className="generatorError">{error}</div>}

            <button className="generatorActionButton" type="button" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generowanie..." : activeDefinition.buttonLabel}
            </button>
          </div>
        </section>
      </div>

      {result && (
        <section className={`generatorResultCard${resultIsNew ? " is-new" : ""}`} style={{ "--accent": activeDefinition.accent }}>
          <div className="generatorResultHeader">
            <div>
              <h3 className="generatorResultTitle">{result.title}</h3>
              <span className="generatorResultSystem">{activeDefinition.title}</span>
            </div>
            <div className="generatorResultActions">
              <button className="generatorResultCopyBtn" type="button" onClick={copyResultToClipboard} title="Kopiuj do schowka">
                Kopiuj
              </button>
              <button className="generatorResultRegenBtn" type="button" onClick={handleRegenerate} disabled={loading} title="Generuj ponownie">
                Ponownie
              </button>
            </div>
          </div>
          <div className="generatorResultList">
            {Object.entries(result.payload).map(([key, value]) => (
              <div key={key} className="generatorResultRow">
                <div className="generatorResultKey">{key}</div>
                <div className="generatorResultValue">{renderValue(value)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
