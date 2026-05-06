import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createCampaignMaterial, listCampaigns } from "../api/campaigns";
import {
  generateContent,
  generateVariantContent,
  getGeneratorDefinitions,
  getGeneratorForm,
} from "../api/generators";

const FALLBACK_CATALOG = [
  {
    type: "name",
    system: "any",
    label: "Imiona / Nazwy",
    description: "Imiona, nazwiska i nazwy z pul seed.",
    source: "seed",
    params: [
      { key: "culture", label: "Kultura", inputType: "select", options: ["Losowa", "Słowiańska", "Nordycka", "Arabska", "Japońska", "Elficka", "Krasnoludzka", "Orcza", "Fantastyczna"], defaultValue: "Losowa" },
      { key: "gender", label: "Płeć", inputType: "select", options: ["Losowa", "Męska", "Żeńska", "Neutralna"], defaultValue: "Losowa" },
      { key: "count", label: "Liczba wyników", inputType: "number", min: 1, max: 10, defaultValue: 3 },
    ],
  },
  {
    type: "npc",
    system: "dnd",
    label: "NPC",
    description: "Postać z wyglądem, osobowością, sekretem i motywacją.",
    source: "seed",
    params: [
      { key: "race", label: "Rasa", inputType: "select", options: ["Losowa", "Człowiek", "Elf", "Krasnolud", "Niziołek", "Gnom", "Półelf", "Półork", "Tiefling", "Dragonborn"], defaultValue: "Losowa" },
      { key: "profession", label: "Profesja/Klasa", inputType: "select", options: ["Losowa", "Strażnik", "Kupiec", "Wiedźma", "Złodziej", "Kapłan", "Szlachcic", "Chłop", "Żołnierz", "Magik"], defaultValue: "Losowa" },
      { key: "role", label: "Rola fabularna", inputType: "select", options: ["Losowa", "Villain", "Quest Giver", "Ally", "Contact", "Neutral", "Rival", "Informant"], defaultValue: "Losowa" },
      { key: "level", label: "Poziom", inputType: "number", min: 1, max: 20, defaultValue: 5 },
    ],
  },
  {
    type: "loot",
    system: "dnd",
    label: "Skarb / Przedmiot",
    description: "Monety, kosztowności, magiczne przedmioty i miejsce ukrycia.",
    source: "seed/algorithm",
    params: [
      { key: "treasureType", label: "Typ skarbu", inputType: "select", options: ["Individual Loot", "Treasure Hoard"], defaultValue: "Treasure Hoard" },
      { key: "crBand", label: "CR / poziom skarbca", inputType: "select", options: ["0-4", "5-10", "11-16", "17+"], defaultValue: "0-4" },
      { key: "contents", label: "Zawartość", inputType: "select", options: ["Wszystko", "Monety", "Kosztowności", "Magiczne"], defaultValue: "Wszystko" },
      { key: "theme", label: "Motyw", inputType: "select", options: ["Podziemie", "Szlachta", "Religijny", "Dzicz", "Arkana"], defaultValue: "Podziemie" },
    ],
  },
];

const SYSTEM_LABELS = {
  any: "Dowolny system",
  dnd: "D&D 5E",
  cthulhu: "Call of Cthulhu 7E",
  wh4e: "Warhammer Fantasy 4E",
  pf2e: "Pathfinder 2E",
  morkborg: "Mork Borg",
};

const CARD_META = {
  npc: {
    title: "NPC",
    tag: "Szybki / Szczegółowy",
    description: "Generuj postacie niezależne, sojuszników, przeciwników i ważne osobistości.",
    tone: "purple",
    icon: "hood",
    order: 10,
  },
  encounter: {
    title: "Encounter",
    tag: "Walka / Non-combat",
    description: "Twórz spotkania dopasowane do poziomu drużyny i wybranego systemu.",
    tone: "red",
    icon: "swords",
    order: 20,
  },
  location: {
    title: "Lokacja",
    tag: "Świat i miejsce",
    description: "Generuj miejsca, budynki, miasta i lokacje dopasowane do klimatu.",
    tone: "teal",
    icon: "castle",
    order: 30,
  },
  loot: {
    title: "Skarb / Przedmiot",
    tag: "Wszystkie typy",
    description: "Skarby, przedmioty magiczne, artefakty, mikstury i wyposażenie sklepów.",
    tone: "gold",
    icon: "chest",
    order: 40,
  },
  hook: {
    title: "Fabuła",
    tag: "Hooki i misje",
    description: "Hooki, misje, zwroty akcji, ploty i zalążki przygód.",
    tone: "green",
    icon: "scroll",
    order: 50,
  },
  weather: {
    title: "Środowisko",
    tag: "Pogoda i warunki",
    description: "Pogoda, warunki podróży, zdarzenia w trasie i zagrożenia środowiskowe.",
    tone: "blue",
    icon: "storm",
    order: 60,
  },
  trap: {
    title: "Pułapka / Hazard",
    tag: "Pułapki i zagrożenia",
    description: "Pułapki, hazardy, zagadki i niebezpieczeństwa czekające na bohaterów.",
    tone: "purple",
    icon: "gear",
    order: 70,
  },
  faction: {
    title: "Frakcja / Kult",
    tag: "Frakcje i organizacje",
    description: "Organizacje, gildie, kulty i grupy działające w twoim świecie.",
    tone: "green",
    icon: "shield",
    order: 80,
  },
  twist: {
    title: "Zwrot akcji",
    tag: "Komplikacje",
    description: "Sekrety, komplikacje i zaskoczenia, które odmienią scenę.",
    tone: "red",
    icon: "spark",
    order: 85,
  },
  name: {
    title: "Imiona / Nazwy",
    tag: "Imiona i nazwy",
    description: "Imiona, nazwiska, nazwy miejsc, karczm, organizacji i artefaktów.",
    tone: "gold",
    icon: "type",
    order: 90,
  },
  tavern: {
    title: "Tawerna",
    tag: "Lokacja",
    description: "Tawerna z wlascicielem, plotka, problemem i lokalnym klimatem.",
    tone: "gold",
    icon: "castle",
    order: 100,
  },
  shop_fantasy: {
    title: "Sklep fantasy",
    tag: "Przedmioty i handel",
    description: "Sklep, wlasciciel, towary, nietypowy przedmiot i problem.",
    tone: "gold",
    icon: "chest",
    order: 110,
  },
  settlement_fantasy: {
    title: "Osada fantasy",
    tag: "Miejsce",
    description: "Osada, wazne miejsce, problem, sekret i zaczepka przygodowa.",
    tone: "teal",
    icon: "castle",
    order: 120,
  },
  district_fantasy: {
    title: "Dzielnica fantasy",
    tag: "Miasto",
    description: "Dzielnica, dominujaca grupa, lokalny konflikt i sekret.",
    tone: "teal",
    icon: "castle",
    order: 130,
  },
  dungeon_concept: {
    title: "Koncept lochu",
    tag: "Loch / ruiny",
    description: "Historia miejsca, obecny stan, glowne zagrozenie i sekret.",
    tone: "purple",
    icon: "gear",
    order: 140,
  },
  dungeon_room: {
    title: "Pomieszczenie lochu",
    tag: "Pokoj / komnata",
    description: "Pojedyncza scena eksploracji z zawartoscia i zagrozeniem.",
    tone: "purple",
    icon: "gear",
    order: 150,
  },
  monster_variant: {
    title: "Wariant potwora",
    tag: "Stworzenie",
    description: "Wariant przeciwnika z wygladem, zachowaniem i slaboscia.",
    tone: "red",
    icon: "swords",
    order: 160,
  },
  magic_item: {
    title: "Magiczny przedmiot",
    tag: "Artefakt",
    description: "Przedmiot magiczny lub przeklety z efektem, wada i historia.",
    tone: "gold",
    icon: "chest",
    order: 170,
  },
  quest_fantasy: {
    title: "Quest fantasy",
    tag: "Misja",
    description: "Zleceniodawca, problem, komplikacja, przeciwnik i nagroda.",
    tone: "green",
    icon: "scroll",
    order: 180,
  },
};

const DEFAULT_META = {
  title: "Generator",
  tag: "Seed-first",
  description: "Generator oparty o backendowe pule i parametry.",
  tone: "purple",
  icon: "spark",
  order: 200,
};

const CANONICAL_GENERATOR_TYPES = [
  "npc",
  "encounter",
  "location",
  "loot",
  "hook",
  "weather",
  "trap",
  "faction",
  "name",
];

const GENERATOR_CATEGORIES = [
  { code: "FANTASY", label: "Fantasy", icon: "swords" },
  { code: "HORROR", label: "Horror", icon: "eye" },
  { code: "POSTAPO", label: "Postapo", icon: "biohazard" },
  { code: "SCIFI", label: "Sci-Fi", icon: "rocket" },
];

const SYSTEM_FILTERS = [
  { value: "all", label: "Wszystkie" },
  { value: "dnd", label: "D&D 5E" },
  { value: "pf2e", label: "Pathfinder 2E" },
  { value: "wfrp4e", label: "Warhammer 4E" },
  { value: "morkborg", label: "Mork Borg" },
  { value: "coc7e", label: "CoC 7E" },
  { value: "alien", label: "Alien" },
];

const TYPE_FILTERS = [
  { value: "all", label: "Wszystkie" },
  { value: "npc", label: "NPC" },
  { value: "location", label: "Lokacje" },
  { value: "settlement", label: "Osady" },
  { value: "encounter", label: "Spotkania" },
  { value: "item", label: "Przedmioty" },
  { value: "creature", label: "Stworzenia" },
  { value: "document", label: "Dokumenty / tropy" },
  { value: "faction", label: "Frakcje" },
  { value: "story", label: "Fabuła" },
  { value: "quest", label: "Questy" },
  { value: "threat", label: "Zagrożenia" },
  { value: "environment", label: "Środowisko" },
  { value: "name", label: "Imiona" },
];

const TONE_OPTIONS_BY_CATEGORY = {
  FANTASY: [
    { value: "all", label: "Wszystkie" },
    { value: "high_fantasy", label: "High fantasy" },
    { value: "low_fantasy", label: "Low fantasy" },
    { value: "dark_fantasy", label: "Dark fantasy" },
    { value: "grimdark", label: "Grimdark" },
    { value: "heroic_fantasy", label: "Heroic fantasy" },
    { value: "sword_and_sorcery", label: "Sword & sorcery" },
  ],
  HORROR: [
    { value: "all", label: "Wszystkie" },
    { value: "cosmic_horror", label: "Cosmic horror" },
    { value: "occult_horror", label: "Occult horror" },
    { value: "folk_horror", label: "Folk horror" },
    { value: "body_horror", label: "Body horror" },
    { value: "psychological_horror", label: "Psychological horror" },
    { value: "investigation_horror", label: "Investigation horror" },
    { value: "survival_horror", label: "Survival horror" },
  ],
  POSTAPO: [
    { value: "all", label: "Wszystkie" },
    { value: "zombie_apocalypse", label: "Zombie apocalypse" },
    { value: "survival_drama", label: "Survival drama" },
    { value: "wasteland", label: "Wasteland" },
    { value: "ruined_city", label: "Ruined city" },
    { value: "road_survival", label: "Road survival" },
    { value: "plague_apocalypse", label: "Plague apocalypse" },
  ],
  SCIFI: [
    { value: "all", label: "Wszystkie" },
    { value: "space_opera", label: "Space opera" },
    { value: "hard_scifi", label: "Hard sci-fi" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "space_horror", label: "Space horror" },
    { value: "dystopia", label: "Dystopia" },
    { value: "corporate_scifi", label: "Corporate sci-fi" },
  ],
};

function buildKey(item) {
  if (item.kind === "variant") return `variant:${item.generatorCode}:${item.variantCode}`;
  return `${item.system}:${item.type}`;
}

function normalizedInputType(param) {
  return String(param.inputType || param.type || "text").toLowerCase();
}

function buildInitialParams(item) {
  return (item?.params || []).reduce((acc, param) => {
    const inputType = normalizedInputType(param);
    acc[param.key] = param.defaultValue ?? (inputType === "number" ? param.min ?? 1 : inputType === "checkbox" ? false : "");
    return acc;
  }, {});
}

function flattenDefinitions(definitions) {
  if (!Array.isArray(definitions)) return [];
  return definitions.flatMap((definition) =>
    (definition.variants || []).map((variant) => ({
      kind: "variant",
      generatorCode: definition.code,
      variantCode: variant.variantCode,
      type: definition.code,
      system: variant.systemCode || "any",
      categoryCode: definition.categoryCode || definition.category,
      typeCode: definition.typeCode || definition.code,
      genreTags: definition.genreTags || [],
      systemTags: definition.systemTags || [],
      toneTags: definition.toneTags || [],
      displayOrder: definition.displayOrder,
      iconKey: definition.iconKey,
      label: variant.name || definition.name,
      description: variant.description || definition.description,
      source: "strategy/seed",
      params: [],
    }))
  );
}

function variantRank(item) {
  if (item.kind === "variant") {
    if (item.variantCode === "dnd.quick" || item.variantCode === "general.quick") return 0;
    if (String(item.variantCode || "").includes("quick")) return 1;
    return 4;
  }
  if (item.system === "dnd" || item.system === "any") return 2;
  return 5;
}

function decorateCatalog(items) {
  const decorated = items
    .map((item) => {
    const meta = CARD_META[item.type] || DEFAULT_META;
    return {
      ...item,
      title: CARD_META[item.type] ? meta.title : item.label,
      label: CARD_META[item.type] ? meta.title : item.label,
      cardTag: CARD_META[item.type] ? meta.tag : item.typeCode || meta.tag,
      cardDescription: CARD_META[item.type] ? meta.description : item.description || meta.description,
      tone: meta.tone,
      icon: item.iconKey || meta.icon,
      order: item.displayOrder || meta.order,
    };
  });

  const byType = new Map();
  for (const item of decorated) {
    const current = byType.get(item.type);
    if (!current || variantRank(item) < variantRank(current)) {
      byType.set(item.type, item);
    }
  }

  return Array.from(byType.values())
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

function renderValue(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "Nie podano";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function resultToClipboardText(result) {
  if (!result) return "";
  if (Array.isArray(result.sections)) {
    return [
      result.title,
      result.subtitle,
      ...result.sections.map((section) => {
        const items = Array.isArray(section.items) && section.items.length
          ? section.items.map((item) => `${item.label}: ${renderValue(item.value)}`).join("\n")
          : "";
        return [section.title, section.content, items].filter(Boolean).join("\n");
      }),
    ].filter(Boolean).join("\n\n");
  }

  return Object.entries(result.payload || {})
    .map(([key, value]) => `${key}: ${renderValue(value)}`)
    .join("\n");
}

function materialTypeFor(generatorCode) {
  return {
    npc: "NPC",
    location: "LOCATION",
    loot: "ITEM",
    trap: "HAZARD",
    faction: "FACTION",
    hook: "STORY",
    twist: "STORY",
    weather: "ENVIRONMENT",
    encounter: "ENCOUNTER",
    name: "NAMES",
  }[generatorCode] || "GENERATED";
}

function trimForApi(value, max) {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function GeneratorIcon({ name }) {
  if (name === "hood") {
    return (
      <IconBase>
        <path d="M5 20c.8-7 3-12 7-15 4 3 6.2 8 7 15" />
        <path d="M8.5 14.5c1.1-1 2.2-1.5 3.5-1.5s2.4.5 3.5 1.5" />
        <path d="M9 20v-2.5a3 3 0 0 1 6 0V20" />
      </IconBase>
    );
  }
  if (name === "swords") {
    return (
      <IconBase>
        <path d="m14 6 4-4 4 4-4 4Z" />
        <path d="m2 22 8-8" />
        <path d="m6 6 4-4 4 4-4 4Z" />
        <path d="m22 22-8-8" />
      </IconBase>
    );
  }
  if (name === "castle") {
    return (
      <IconBase>
        <path d="M5 21V9h4v4h6V9h4v12" />
        <path d="M5 9V4h3v3h3V4h2v3h3V4h3v5" />
        <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
      </IconBase>
    );
  }
  if (name === "chest") {
    return (
      <IconBase>
        <path d="M4 9h16v10H4z" />
        <path d="M4 9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5" />
        <path d="M12 9v10" />
        <path d="M10 13h4" />
      </IconBase>
    );
  }
  if (name === "scroll") {
    return (
      <IconBase>
        <path d="M8 4h9a3 3 0 0 1 0 6H8a3 3 0 1 0 0 6h9" />
        <path d="M8 16a3 3 0 1 1 0-6" />
        <path d="M10 8h6" />
        <path d="M10 14h6" />
      </IconBase>
    );
  }
  if (name === "storm") {
    return (
      <IconBase>
        <path d="M7 16a4 4 0 1 1 1-7.9A5 5 0 0 1 18 10a3 3 0 0 1-.5 6" />
        <path d="m13 13-3 5h4l-2 4" />
      </IconBase>
    );
  }
  if (name === "gear") {
    return (
      <IconBase>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1-2.8-2.8.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2.8-2.8.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.6 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </IconBase>
    );
  }
  if (name === "shield") {
    return (
      <IconBase>
        <path d="M12 3 5 6v5c0 5 3.4 8.5 7 10 3.6-1.5 7-5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-5" />
      </IconBase>
    );
  }
  if (name === "type") {
    return (
      <IconBase>
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
      </IconBase>
    );
  }
  if (name === "eye") {
    return (
      <IconBase>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </IconBase>
    );
  }
  if (name === "biohazard") {
    return (
      <IconBase>
        <circle cx="12" cy="12" r="2" />
        <path d="M12 10V4a4 4 0 0 1 3.4 6" />
        <path d="m10.3 13-5.2 3a4 4 0 0 1 3.5-5.9" />
        <path d="m13.7 13 5.2 3a4 4 0 0 0-3.5-5.9" />
      </IconBase>
    );
  }
  if (name === "rocket") {
    return (
      <IconBase>
        <path d="M5 15c-1 1.2-1.5 2.8-1.5 5 2.2 0 3.8-.5 5-1.5" />
        <path d="M15 3c3 0 5 0 6 1-1 5-4 9-8 12l-5-5c3-4 7-7 12-8Z" />
        <path d="M9 15H5v-4" />
        <circle cx="15" cy="9" r="1.5" />
      </IconBase>
    );
  }
  return (
    <IconBase>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
      <path d="m18 15 .9 2.6 2.6.9-2.6.9L18 23l-.9-2.6-2.6-.9 2.6-.9Z" />
    </IconBase>
  );
}

function Field({ param, value, onChange }) {
  const inputType = normalizedInputType(param);

  if (inputType === "select") {
    return (
      <div className="generatorField">
        <label className="generatorLabel">{param.label}</label>
        <select className="generatorInput" value={value ?? ""} onChange={(event) => onChange(param.key, event.target.value)}>
          {(param.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }

  if (inputType === "checkbox" || inputType === "toggle") {
    return (
      <label className="generatorCheckField">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(param.key, event.target.checked)} />
        <span>{param.label}</span>
      </label>
    );
  }

  return (
    <div className="generatorField">
      <label className="generatorLabel">{param.label}</label>
      <input
        className="generatorInput"
        type={inputType || "text"}
        min={param.min ?? undefined}
        max={param.max ?? undefined}
        value={value ?? ""}
        onChange={(event) => onChange(param.key, event.target.value)}
      />
    </div>
  );
}

function generatorPath(item) {
  return `/generators/${encodeURIComponent(item.type)}`;
}

function resultSections(result) {
  if (!result) return [];
  if (Array.isArray(result.sections)) return result.sections;
  return Object.entries(result.payload || {}).map(([key, value]) => ({
    title: key,
    content: renderValue(value),
  }));
}

export default function GeneratorsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { generatorCode } = useParams();
  const [catalog, setCatalog] = useState(decorateCatalog(FALLBACK_CATALOG));
  const [activeKey, setActiveKey] = useState(() => buildKey(decorateCatalog(FALLBACK_CATALOG)[0]));
  const [forms, setForms] = useState(() => ({ [buildKey(decorateCatalog(FALLBACK_CATALOG)[0])]: buildInitialParams(decorateCatalog(FALLBACK_CATALOG)[0]) }));
  const [result, setResult] = useState(null);
  const [resultIsNew, setResultIsNew] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [activeCategory, setActiveCategory] = useState("FANTASY");
  const [selectedSystem, setSelectedSystem] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTone, setSelectedTone] = useState("all");
  const [loading, setLoading] = useState(false);
  const [addingToCampaign, setAddingToCampaign] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const definitions = await getGeneratorDefinitions(token, {
          category: activeCategory,
          system: selectedSystem,
          type: selectedType,
          tone: selectedTone,
        });
        const nextCatalog = decorateCatalog(flattenDefinitions(definitions));
        if (cancelled) return;
        setCatalog(nextCatalog);
        setActiveKey((previous) => nextCatalog.some((item) => buildKey(item) === previous) ? previous : nextCatalog[0] ? buildKey(nextCatalog[0]) : "");
        setForms((previous) => {
          const next = { ...previous };
          for (const item of nextCatalog) {
            const key = buildKey(item);
            if (!next[key]) next[key] = buildInitialParams(item);
          }
          return next;
        });
      } catch {
        if (!cancelled) setCatalog(decorateCatalog(FALLBACK_CATALOG));
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [token, activeCategory, selectedSystem, selectedType, selectedTone]);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns() {
      if (!token) {
        setCampaigns([]);
        setSelectedCampaignId("");
        return;
      }
      try {
        const data = await listCampaigns(token);
        if (cancelled) return;
        const nextCampaigns = Array.isArray(data) ? data : [];
        setCampaigns(nextCampaigns);
        setSelectedCampaignId((previous) => previous || String(nextCampaigns[0]?.id || ""));
      } catch {
        if (!cancelled) setCampaigns([]);
      }
    }

    loadCampaigns();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const activeDefinition = useMemo(
    () => catalog.find((item) => buildKey(item) === activeKey) || catalog[0],
    [activeKey, catalog]
  );
  const activeValues = forms[activeKey] || buildInitialParams(activeDefinition);
  const visibleCatalog = catalog;

  const toneOptions = TONE_OPTIONS_BY_CATEGORY[activeCategory] || [{ value: "all", label: "Wszystkie" }];

  function handleCategoryChange(category) {
    setActiveCategory(category);
    setSelectedTone("all");
    setResult(null);
  }

  useEffect(() => {
    if (!generatorCode || !catalog.length) return;
    const routeTarget = catalog.find((item) => item.type === generatorCode);
    if (!routeTarget) return;
    setActiveKey(buildKey(routeTarget));
  }, [catalog, generatorCode]);

  useEffect(() => {
    if (!activeDefinition || activeDefinition.kind !== "variant" || activeDefinition.params?.length) return;
    let cancelled = false;

    async function loadForm() {
      try {
        const form = await getGeneratorForm(token, activeDefinition.generatorCode, activeDefinition.variantCode);
        if (cancelled) return;
        const params = (form.fields || []).map((field) => ({
          key: field.key,
          label: field.label,
          inputType: String(field.type || "text").toLowerCase(),
          options: field.options || [],
          defaultValue: field.defaultValue,
          required: field.required,
        }));
        setCatalog((previous) => previous.map((item) =>
          buildKey(item) === activeKey
            ? { ...item, label: item.title || form.name || item.label, description: form.description || item.description, params }
            : item
        ));
        setForms((previous) => ({
          ...previous,
          [activeKey]: previous[activeKey] && Object.keys(previous[activeKey]).length
            ? previous[activeKey]
            : buildInitialParams({ params }),
        }));
      } catch (e) {
        if (!cancelled) setError(e?.message || "Nie udało się pobrać formularza generatora.");
      }
    }

    loadForm();
    return () => {
      cancelled = true;
    };
  }, [activeDefinition, activeKey, token]);

  function setFieldValue(key, value) {
    setForms((prev) => ({
      ...prev,
      [activeKey]: {
        ...(prev[activeKey] || {}),
        [key]: value,
      },
    }));
  }

  function activeGeneratorCode() {
    return activeDefinition?.kind === "variant" ? activeDefinition.generatorCode : activeDefinition?.type;
  }

  function activeVariantCode() {
    return activeDefinition?.kind === "variant" ? activeDefinition.variantCode : `${activeDefinition?.system}.quick`;
  }

  async function handleAddToCampaign() {
    if (!result || !token) {
      setError("Zaloguj się, żeby dodać wynik do kampanii.");
      return;
    }
    if (!selectedCampaignId) {
      setError("Wybierz kampanię przed dodaniem wyniku.");
      return;
    }
    setAddingToCampaign(true);
    setError("");
    setNotice("");
    try {
      const generatorCode = result.generatorCode || activeGeneratorCode();
      const title = trimForApi(result.title || activeDefinition?.label || "Wygenerowana treść", 200);
      const content = trimForApi(resultToClipboardText(result), 5000);
      await createCampaignMaterial(token, selectedCampaignId, {
        type: materialTypeFor(generatorCode),
        title,
        content,
      });
      setNotice(`Dodano do kampanii: ${title}`);
    } catch (e) {
      setError(e?.message || "Nie udało się dodać wyniku do kampanii.");
    } finally {
      setAddingToCampaign(false);
    }
  }

  async function handleGenerate(target = activeDefinition) {
    if (!target) {
      setError("Nie znaleziono generatora.");
      return;
    }

    const key = buildKey(target);
    setActiveKey(key);
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);

    try {
      const values = forms[key] || buildInitialParams(target);
      const generated = target.kind === "variant"
        ? await generateVariantContent(token, target.generatorCode, target.variantCode, values)
        : await generateContent(token, target.system, target.type, values);
      setResult(generated);
      setResultIsNew(true);
      setTimeout(() => setResultIsNew(false), 600);
    } catch (e) {
      setError(e?.message || "Nie udało się wygenerować treści.");
    } finally {
      setLoading(false);
    }
  }

  function copyResultToClipboard() {
    if (!result) return;
    navigator.clipboard.writeText(resultToClipboardText(result)).catch(() => {
      alert("Nie udało się skopiować do schowka");
    });
  }

  if (generatorCode) {
    const sections = resultSections(result);

    return (
      <div className={`page generatorsPage generatorsDashboard generatorWindowPage generatorWindowPage--${activeDefinition?.tone || "purple"}`}>
        <header className="generatorWindowHero">
          <button type="button" className="generatorBackButton" onClick={() => navigate("/generators")}>
            {"← Generatory"}
          </button>
          <div className="generatorWindowTitle">
            <div className="generatorsHeroIcon" aria-hidden="true">
              <GeneratorIcon name={activeDefinition?.icon || "spark"} />
            </div>
            <div>
              <h1>{activeDefinition?.label || "Generator"} Generator</h1>
              <p>{activeDefinition?.cardDescription || activeDefinition?.description || "Wygeneruj element dopasowany do swoich potrzeb."}</p>
            </div>
          </div>
        </header>

        <div className="generatorWindowWorkspace">
        <div className="generatorWindowShell">
          <aside className="generatorSettingsPanel">
            <div className="generatorPanelNumber">1. Ustawienia</div>

            <div className="generatorModeGroup">
              <span className="generatorSettingsLabel">Tryb generatora</span>
              <div className="generatorModeButtons">
                <button type="button" className="is-active">
                  <GeneratorIcon name="spark" />
                  <span>
                    <strong>Szybki</strong>
                    <small>Podstawowe informacje</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="generatorWindowFields">
              {activeDefinition?.params?.length ? (
                activeDefinition.params.map((param) => (
                  <Field key={param.key} param={param} value={activeValues[param.key]} onChange={setFieldValue} />
                ))
              ) : (
                <p className="generatorCatalogEmpty">Formularz jest wczytywany albo ten generator nie wymaga parametrów.</p>
              )}
            </div>

            {error && <div className="generatorError">{error}</div>}
            {notice && <div className="generatorNotice">{notice}</div>}

            <button className="generatorWindowGenerate" type="button" onClick={() => handleGenerate(activeDefinition)} disabled={loading || catalogLoading}>
              <GeneratorIcon name="spark" />
              <span>{loading ? "Generowanie..." : `Generuj ${activeDefinition?.label || ""}`}</span>
            </button>
            <button className="generatorAdvancedButton" type="button" disabled>Opcje zaawansowane</button>
          </aside>

          <main className="generatorOutputPanel">
            <div className="generatorOutputTop">
              <div className="generatorPanelNumber">2. Wynik</div>
            <div className="generatorOutputActions">
                <button type="button" onClick={copyResultToClipboard} disabled={!result}>Kopiuj</button>
                {campaigns.length > 0 && (
                  <select className="generatorCampaignSelect" value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)}>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>{campaign.title || campaign.name}</option>
                    ))}
                  </select>
                )}
                <button type="button" onClick={handleAddToCampaign} disabled={!result || addingToCampaign || !campaigns.length}>
                  {addingToCampaign ? "Dodawanie..." : "Dodaj do kampanii"}
                </button>
              </div>
            </div>

            {result ? (
              <section className={`generatorWindowResult${resultIsNew ? " is-new" : ""}`}>
                <div className="generatorResultIdentity">
                  <div className="generatorPortrait" aria-hidden="true">
                    <GeneratorIcon name={activeDefinition?.icon || "spark"} />
                  </div>
                  <div>
                    <h2>{result.title}</h2>
                    <p>{result.subtitle || SYSTEM_LABELS[result.system] || result.system}</p>
                  </div>
                </div>

                <div className="generatorResultMetaStrip">
                  <span><small>System</small><strong>{SYSTEM_LABELS[result.system] || result.system || "D&D 5E"}</strong></span>
                  <span><small>Źródło</small><strong>{result.source || activeDefinition?.source || "seed"}</strong></span>
                  <span><small>Wariant</small><strong>{result.variantCode || activeVariantCode()}</strong></span>
                  <span><small>Typ</small><strong>{activeDefinition?.label}</strong></span>
                </div>

                <div className="generatorWindowSections">
                  {sections.map((section, index) => (
                    <article key={`${section.title}-${index}`} className={Array.isArray(section.items) && section.items.length ? "has-items" : ""}>
                      <h3>{section.title}</h3>
                      {section.content && <p>{section.content}</p>}
                      {Array.isArray(section.items) && section.items.length > 0 && (
                        <div className="generatorWindowStats">
                          {section.items.map((item) => (
                            <span key={item.label}>
                              <small>{item.label}</small>
                              <strong>{renderValue(item.value)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                <div className="generatorWindowBottomActions">
                  <button type="button" onClick={() => handleGenerate(activeDefinition)} disabled={loading}>Generuj ponownie</button>
                  <button type="button" className="is-primary" disabled>Edytuj i rozwiń</button>
                </div>
              </section>
            ) : (
              <div className="generatorWindowEmpty">
                <GeneratorIcon name={activeDefinition?.icon || "spark"} />
                <strong>Wynik pojawi się tutaj</strong>
                <span>Ustaw parametry po lewej i uruchom generator.</span>
              </div>
            )}
          </main>
        </div>

        </div>
      </div>
    );
  }

  return (
    <div className="page generatorsPage generatorsDashboard">
      <header className="generatorsHero">
        <div className="generatorsHeroIcon" aria-hidden="true">
          <GeneratorIcon name="spark" />
        </div>
        <div>
          <h1>Generatory</h1>
          <p>Seed-first generatory do pracy przy stole, z wynikami liczonymi albo losowanymi po stronie backendu.</p>
        </div>
      </header>

      <section className="generatorsCommandBar" aria-label="Filtry generatorów">
        <div className="generatorsTabs">
          {GENERATOR_CATEGORIES.map(({ code, label, icon }) => (
            <button key={code} type="button" className={activeCategory === code ? "is-active" : ""} onClick={() => handleCategoryChange(code)}>
              <GeneratorIcon name={icon} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <label className="generatorsSystemSelect">
          <span>System:</span>
          <select value={selectedSystem} onChange={(event) => setSelectedSystem(event.target.value)}>
            {SYSTEM_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="generatorsSystemSelect">
          <span>Typ:</span>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            {TYPE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="generatorsSystemSelect">
          <span>Klimat:</span>
          <select value={selectedTone} onChange={(event) => setSelectedTone(event.target.value)}>
            {toneOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="generatorsWorkspace">
        <main className="generatorsMain">
          <section className="generatorCardsGrid" aria-busy={catalogLoading}>
            {visibleCatalog.map((generator) => {
              const isActive = buildKey(generator) === activeKey;
              return (
                <article key={buildKey(generator)} className={`generatorTile generatorTile--${generator.tone}${isActive ? " is-active" : ""}`}>
                  <button
                    type="button"
                    className="generatorTileStar"
                    title="Oznacz jako ulubiony"
                    aria-label="Oznacz jako ulubiony"
                    onClick={() => {
                      navigate(generatorPath(generator));
                      setResult(null);
                    }}
                  >
                    {"☆"}
                  </button>
                  <button
                    type="button"
                    className="generatorTileBody"
                    onClick={() => {
                      navigate(generatorPath(generator));
                    }}
                  >
                    <span className="generatorTileIcon">
                      <GeneratorIcon name={generator.icon} />
                    </span>
                    <span className="generatorTileTitle">{generator.label}</span>
                    <span className="generatorTileTag">{generator.cardTag}</span>
                    <span className="generatorTileDescription">{generator.cardDescription}</span>
                    <span className="generatorTileMeta">
                      <span>{generator.categoryCode || activeCategory}</span>
                      <span>{generator.typeCode || generator.type}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="generatorTileAction"
                    disabled={loading && isActive}
                    onClick={() => {
                      navigate(generatorPath(generator));
                    }}
                  >
                    <span>Otwórz</span>
                    <span aria-hidden="true">{"→"}</span>
                  </button>
                </article>
              );
            })}
            {!catalogLoading && visibleCatalog.length === 0 && (
              <div className="generatorCatalogEmpty">
                Brak generatorów dla wybranych filtrów. Ta kategoria będzie uzupełniana w kolejnych etapach.
              </div>
            )}
          </section>
        </main>

      </div>
    </div>
  );
}
