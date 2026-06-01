import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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
    label: "Imiona",
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
    system: "any",
    label: "NPC",
    description: "Postać z wyglądem, osobowością, sekretem i motywacją.",
    source: "seed",
    params: [
      { key: "race", label: "Rasa", inputType: "select", options: ["Losowa", "Człowiek", "Elf", "Krasnolud", "Niziołek", "Gnom", "Półelf", "Półork", "Tiefling", "Dragonborn"], defaultValue: "Losowa" },
      { key: "profession", label: "Profesja", inputType: "select", options: ["Losowa", "Strażnik", "Kupiec", "Wiedźma", "Złodziej", "Kapłan", "Szlachcic", "Chłop", "Żołnierz", "Magik"], defaultValue: "Losowa" },
      { key: "role", label: "Rola fabularna", inputType: "select", options: ["Losowa", "Villain", "Quest Giver", "Ally", "Contact", "Neutral", "Rival", "Informant"], defaultValue: "Losowa" },
    ],
  },
  {
    type: "loot",
    system: "any",
    label: "Skarb",
    description: "Monety, kosztowności, magiczne przedmioty i miejsce ukrycia.",
    source: "seed/algorithm",
    params: [
      { key: "treasureType", label: "Typ skarbu", inputType: "select", options: ["Individual Loot", "Treasure Hoard"], defaultValue: "Treasure Hoard" },
      { key: "contents", label: "Zawartość", inputType: "select", options: ["Wszystko", "Monety", "Kosztowności", "Magiczne"], defaultValue: "Wszystko" },
      { key: "theme", label: "Motyw", inputType: "select", options: ["Podziemie", "Szlachta", "Religijny", "Dzicz", "Arkana"], defaultValue: "Podziemie" },
    ],
  },
];

const SYSTEM_LABELS = {
  any: "Ogólny",
  system_agnostic: "Ogólny",
};

const FAVORITES_STORAGE_KEY = "ttrpg.generatorFavorites";
const GENERATOR_HISTORY_STORAGE_KEY = "ttrpg.generatorHistory";
const GENERATOR_HISTORY_LIMIT = 10;

const GENERATOR_CATEGORY_CONFIG = [
  { value: "all", label: "Wszystkie typy", icon: "spark", aliases: [] },
  { value: "characters", label: "Postacie", icon: "hood", aliases: ["name", "npc", "coc_investigator_npc", "character", "person"] },
  { value: "locations", label: "Lokacje", icon: "castle", aliases: ["location", "tavern", "shop_fantasy", "settlement_fantasy", "district_fantasy", "castle_fantasy", "place"] },
  { value: "organizations", label: "Organizacje", icon: "shield", aliases: ["faction", "organization", "organisations", "organizations"] },
  { value: "world", label: "Swiat", icon: "planet", aliases: ["fantasy_world", "calendar_fantasy", "demographics_fantasy", "scifi_world", "star_system", "world"] },
  { value: "adventures", label: "Przygody", icon: "scroll", aliases: ["hook", "quest_fantasy", "encounter", "encounter_quick", "complication_quick", "adventure", "scene"] },
  { value: "items", label: "Przedmioty", icon: "chest", aliases: ["loot", "loot_fantasy", "magic_item", "item", "treasure"] },
  { value: "clues", label: "Wskazowki", icon: "eye", aliases: ["clue", "document_quick", "hint", "evidence"] },
  { value: "dungeons", label: "Lochy", icon: "gear", aliases: ["five_room_dungeon", "dungeon_advanced", "dungeon_concept", "dungeon_room", "dungeon", "room"] },
  { value: "events", label: "Wydarzenia", icon: "bolt", aliases: ["event_quick", "event", "twist"] },
  { value: "food", label: "Jedzenie", icon: "bowl", aliases: ["food_quick", "food", "meal"] },
];

const GENERATOR_CATEGORY_BY_ALIAS = GENERATOR_CATEGORY_CONFIG.reduce((map, category) => {
  for (const alias of category.aliases) map[alias] = category.value;
  return map;
}, {});

const CARD_META = {
  npc: {
    title: "NPC",
    tag: "Setting",
    description: "Jeden generator postaci z wyborem settingu, roli, sekretu i haczyka.",
    tone: "green",
    icon: "hood",
    order: 10,
  },
  encounter: {
    title: "Encounter",
    tag: "Walka",
    description: "Twórz spotkania opisowe dopasowane do poziomu zagrożenia i sytuacji przy stole.",
    tone: "red",
    icon: "swords",
    order: 20,
  },
  location: {
    title: "Lokacja",
    tag: "Setting",
    description: "Jeden generator miejsc: wybierz setting i losowy albo konkretny typ lokacji.",
    tone: "teal",
    icon: "castle",
    order: 30,
  },
  loot: {
    title: "Skarb",
    tag: "Wszystkie typy",
    description: "Skarby, przedmioty magiczne, artefakty, mikstury i wyposażenie sklepów.",
    tone: "gold",
    icon: "chest",
    order: 40,
  },
  hook: {
    title: "Przygoda",
    tag: "Setting",
    description: "Krotki zalazek przygody z problemem, detalem, komplikacja i wskazowka.",
    tone: "green",
    icon: "scroll",
    order: 50,
  },
  weather: {
    title: "Pogoda",
    tag: "Pogoda i warunki",
    description: "Opis pogody, temperatura, odchylenie od normy oraz wiatr.",
    tone: "blue",
    icon: "storm",
    order: 60,
  },
  trap: {
    title: "Pułapka",
    tag: "Pułapki i zagrożenia",
    description: "Pułapki, hazardy, zagadki i niebezpieczeństwa czekające na bohaterów.",
    tone: "green",
    icon: "gear",
    order: 70,
  },
  faction: {
    title: "Organizacje",
    tag: "Setting",
    description: "Organizacje dopasowane do settingu: cel, metody, zasoby, sekret i konflikt.",
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
  loot_fantasy: {
    title: "Łup",
    tag: "Fantasy",
    description: "Szybki łup: monety, główny przedmiot, dziwny detal i sekret.",
    tone: "gold",
    icon: "chest",
    order: 86,
  },
  clue: {
    title: "Wskazówka",
    tag: "Setting",
    description: "Dowód albo ślad do sceny: opis, znaczenie i zwodniczy detal.",
    tone: "green",
    icon: "scroll",
    order: 87,
  },
  name: {
    title: "Imiona",
    tag: "Imiona i nazwy",
    description: "Generator tworzy tylko imiona i nazwiska postaci.",
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
    tag: "Lokacja",
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
    tag: "Loch",
    description: "Historia miejsca, obecny stan, glowne zagrozenie i sekret.",
    tone: "green",
    icon: "gear",
    order: 140,
  },
  dungeon_room: {
    title: "Pomieszczenie lochu",
    tag: "Pokoj",
    description: "Pojedyncza scena eksploracji z zawartoscia i zagrozeniem.",
    tone: "green",
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
  fantasy_world: {
    title: "Swiat fantasy",
    tag: "Worldbuilding",
    description: "Swiat fantasy z magia, geografia, konfliktem, krolestwem i sekretem.",
    tone: "green",
    icon: "planet",
    order: 240,
  },
  calendar_fantasy: {
    title: "Kalendarz fantasy",
    tag: "Worldbuilding",
    description: "Kalendarz swiata: tygodnie, miesiace, ksiezyce, swieta i presja czasu.",
    tone: "blue",
    icon: "clock",
    order: 250,
  },
  demographics_fantasy: {
    title: "Demografia sredniowieczna",
    tag: "Osada",
    description: "Populacja, grupy mieszkancow, zawody, jezyki, religia i napiecia.",
    tone: "gold",
    icon: "users",
    order: 260,
  },
  castle_fantasy: {
    title: "Zamek fantasy",
    tag: "Lokacja",
    description: "Zamek lub twierdza z typem, stanem, wladca, problemem i sekretem.",
    tone: "teal",
    icon: "castle",
    order: 270,
  },
  five_room_dungeon: {
    title: "Loch",
    tag: "Mapa",
    description: "Pięciopokojowy loch z wejściem, wyzwaniem, komplikacją, konfliktem, nagrodą i prostą mapą.",
    tone: "red",
    icon: "map",
    order: 280,
  },
  coc_investigator_npc: {
    title: "NPC grozy sledczej",
    tag: "Horror",
    description: "Opisowy NPC horroru sledczego z obsesja, sekretem i tropem.",
    tone: "green",
    icon: "eye",
    order: 135,
  },
  scifi_world: {
    title: "Swiat sci-fi",
    tag: "Planeta",
    description: "Swiat sci-fi z technologia, rzadem, kultura, konfliktem i sekretem.",
    tone: "blue",
    icon: "planet",
    order: 135,
  },
  star_system: {
    title: "System gwiezdny",
    tag: "Kosmos",
    description: "System gwiezdny z gwiazda, planetami, zagrozeniami i frakcjami.",
    tone: "blue",
    icon: "planet",
    order: 145,
  },
};

const DEFAULT_META = {
  title: "Generator",
  tag: "Seed-first",
  description: "Generator oparty o backendowe pule i parametry.",
  tone: "green",
  icon: "spark",
  order: 200,
};

const TYPE_THEME = {
  npc: { tone: "green", icon: "hood" },
  location: { tone: "teal", icon: "castle" },
  settlement: { tone: "teal", icon: "castle" },
  world: { tone: "cyan", icon: "planet" },
  worldbuilding: { tone: "cyan", icon: "planet" },
  encounter: { tone: "red", icon: "swords" },
  item: { tone: "gold", icon: "chest" },
  creature: { tone: "crimson", icon: "swords" },
  clue: { tone: "sage", icon: "eye" },
  resource: { tone: "amber", icon: "chest" },
  event: { tone: "indigo", icon: "spark" },
  mood: { tone: "pink", icon: "eye" },
  complication: { tone: "orange", icon: "gear" },
  obstacle: { tone: "red", icon: "gear" },
  travel: { tone: "blue", icon: "map" },
  sensory: { tone: "pink", icon: "eye" },
  rumor: { tone: "green", icon: "scroll" },
  social: { tone: "emerald", icon: "users" },
  rule: { tone: "slate", icon: "scroll" },
  faction: { tone: "emerald", icon: "shield" },
  story: { tone: "green", icon: "scroll" },
  quest: { tone: "green", icon: "scroll" },
  threat: { tone: "crimson", icon: "swords" },
  environment: { tone: "blue", icon: "storm" },
  name: { tone: "yellow", icon: "type" },
  scene: { tone: "indigo", icon: "spark" },
};
const GENERATOR_TYPE_OVERRIDES = {
  encounter_quick: "story",
  event_quick: "story",
  complication_quick: "story",
  food_quick: "item",
};

const TYPE_LABELS = {
  npc: "NPC",
  location: "Lokacja",
  item: "Przedmiot",
  clue: "Tropy",
  faction: "Frakcje",
  story: "Fabula",
  environment: "Pogoda",
  name: "Imiona",
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

function readFavoriteKeys() {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeFavoriteKeys(keys) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(keys)));
}

function readGeneratorHistory() {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(GENERATOR_HISTORY_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.result) : [];
  } catch {
    return [];
  }
}

function writeGeneratorHistory(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GENERATOR_HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, GENERATOR_HISTORY_LIMIT)));
}

function normalizedInputType(param) {
  return String(param.inputType || param.type || "text").toLowerCase();
}

function buildInitialParams(item) {
  return visibleParams(item?.params).reduce((acc, param) => {
    const inputType = normalizedInputType(param);
    acc[param.key] = param.defaultValue ?? (inputType === "number" ? param.min ?? 1 : inputType === "checkbox" ? false : "");
    return acc;
  }, {});
}

function visibleParams(params = []) {
  return params.filter((param) => param.key !== "system");
}

const NPC_ROLE_OPTIONS_BY_SETTING = {
  Fantasy: ["Losowa", "Kupiec", "Strażnik", "Uczony", "Kapłan", "Przestępca", "Szlachcic", "Rzemieślnik", "Podróżnik", "Najemnik", "Zwiadowca", "Alchemik", "Bard", "Sędzia", "Herold"],
  Horror: ["Losowa", "Śledczy", "Świadek", "Podejrzany", "Lekarz", "Bibliotekarz", "Okultysta", "Dziennikarz", "Ksiądz", "Dozorca", "Fotograf", "Patolog"],
  "Sci-Fi": ["Losowa", "Mechanik", "Pilot", "Medyk", "Najemnik", "Analityk", "Przemytnik", "Oficer stacji", "Haker", "Dyplomata", "Inżynier napędu", "Kurier orbitalny"],
  Postapo: ["Losowa", "Ocalały", "Lider osady", "Szabrownik", "Medyk", "Łowca zasobów", "Strażnik bramy", "Handlarz wodą", "Zwiadowca", "Mechanik", "Kaznodzieja"],
  Realistyczny: ["Losowa", "Dziennikarz", "Policjant", "Lekarz", "Prawnik", "Kierowca", "Urzędnik", "Nauczyciel", "Ochroniarz", "Recepcjonistka", "Technik"],
};

const LOCATION_TYPE_OPTIONS_BY_SETTING = {
  Fantasy: ["Losowy", "Tawerna", "Sklep", "Osada", "Dzielnica", "Świątynia", "Biblioteka", "Port", "Las", "Ruiny", "Zamek", "Wieża maga", "Cmentarz", "Most", "Kopalnia", "Młyn", "Sąd"],
  Horror: ["Losowy", "Miejsce śledztwa", "Archiwum", "Szpital", "Świątynia", "Las", "Motel", "Stary dom", "Kostnica", "Szkoła", "Sanatorium"],
  "Sci-Fi": ["Losowy", "Statek kosmiczny", "Stacja kosmiczna", "Kolonia", "Planeta", "Laboratorium", "Port orbitalny", "Wrak", "Kopuła mieszkalna", "Kopalnia asteroid", "Archiwum danych"],
  Postapo: ["Losowy", "Schronienie", "Ruiny miejskie", "Bunkier", "Farma", "Fabryka", "Posterunek", "Targ złomu", "Wieża radiowa", "Stacja benzynowa", "Tunel metra"],
  Realistyczny: ["Losowy", "Mieszkanie", "Biuro", "Bar", "Magazyn", "Dworzec", "Hotel", "Parking", "Kawiarnia", "Szpital", "Komisariat", "Warsztat"],
};

const FACTION_TYPE_OPTIONS_BY_SETTING = {
  Fantasy: ["Losowy", "Gildia", "Zakon", "Rada miejska", "Kult", "Kompania najemna", "Cech", "Bractwo", "Ród", "Krąg magów", "Straż świątynna", "Liga kupiecka"],
  Horror: ["Losowy", "Kult", "Towarzystwo okultystyczne", "Fundacja", "Krąg badaczy", "Rodzina wpływów", "Komitet parafialny", "Sanatorium", "Klub kolekcjonerów"],
  "Sci-Fi": ["Losowy", "Korporacja", "Załoga", "Agencja", "Kartel", "Konsorcjum", "Ruch oporu", "Klan orbitalny", "Syndykat danych", "Flota najemna"],
  Postapo: ["Losowy", "Osada", "Banda", "Karawana", "Milicja", "Klan", "Syndykat zasobów", "Radio-wspólnota", "Zakon wody", "Mechanicy"],
  Realistyczny: ["Losowy", "Stowarzyszenie", "Firma", "Komitet", "Ruch społeczny", "Sieć kontaktów", "Fundacja", "Spółdzielnia", "Klub"],
};

const CLUE_TYPE_OPTIONS_BY_SETTING = {
  Fantasy: ["Losowy", "Ślad fizyczny", "Znak magiczny", "Plotka", "Dokument", "Relikwia", "Herb", "Przysięga", "Mapa", "Pieczęć"],
  Horror: ["Losowy", "Ślad fizyczny", "Dokument", "Relacja świadka", "Nagranie", "Symbol", "Fotografia", "Próbka", "List", "Brakujący przedmiot"],
  "Sci-Fi": ["Losowy", "Log systemowy", "Nagranie", "Uszkodzony sensor", "Dane biometryczne", "Brakujący plik", "Fałszywy identyfikator", "Sygnał", "Czarna skrzynka"],
  Postapo: ["Losowy", "Ślad w terenie", "Porzucony przedmiot", "Mapa", "Radio", "Znak ostrzegawczy", "Świeże ognisko", "Łuska", "Filtr", "Opaska"],
  Realistyczny: ["Losowy", "Dokument", "Monitoring", "Zeznanie", "Rzecz osobista", "Niepasujący detal", "Paragon", "Telefon", "Klucz", "Notatka"],
};

function scopedParams(params = [], values = {}, generatorCode = "") {
  const setting = values.setting || "Losowy";
  return visibleParams(params).map((param) => {
    if (generatorCode === "npc" && param.key === "role") {
      return { ...param, options: NPC_ROLE_OPTIONS_BY_SETTING[setting] || ["Losowa"] };
    }
    if (generatorCode === "location" && param.key === "locationType") {
      return { ...param, options: LOCATION_TYPE_OPTIONS_BY_SETTING[setting] || ["Losowy"] };
    }
    if (generatorCode === "faction" && param.key === "factionType") {
      return { ...param, options: FACTION_TYPE_OPTIONS_BY_SETTING[setting] || ["Losowy"] };
    }
    if (generatorCode === "clue" && param.key === "clueType") {
      return { ...param, options: CLUE_TYPE_OPTIONS_BY_SETTING[setting] || ["Losowy"] };
    }
    return param;
  });
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
      category: definition.category,
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
    if (item.variantCode === "general.quick") return 0;
    if (String(item.variantCode || "").includes("quick")) return 1;
    return 4;
  }
  if (item.system === "system_agnostic" || item.system === "any") return 2;
  return 5;
}

function decorateCatalog(items) {
  const decorated = items
    .map((item) => {
    const meta = CARD_META[item.type] || DEFAULT_META;
    const catalogTypeCode = GENERATOR_TYPE_OVERRIDES[item.type] || item.typeCode || item.type;
    const typeTheme = TYPE_THEME[catalogTypeCode] || TYPE_THEME[item.type] || {};
    const typeLabel = TYPE_LABELS[catalogTypeCode] || catalogTypeCode;
    return {
      ...item,
      catalogTypeCode,
      typeLabel,
      title: CARD_META[item.type] ? meta.title : item.label,
      label: CARD_META[item.type] ? meta.title : item.label,
      cardTag: typeLabel,
      cardDescription: CARD_META[item.type] ? meta.description : item.description || meta.description,
      tone: typeTheme.tone || meta.tone,
      icon: typeTheme.icon || item.iconKey || meta.icon,
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
  if (name === "map") {
    return (
      <IconBase>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </IconBase>
    );
  }
  if (name === "planet") {
    return (
      <IconBase>
        <circle cx="12" cy="12" r="5" />
        <path d="M3 14c4.5-5.2 13.5-8.2 18-4" />
        <path d="M4 15.5c5 2.8 12.5 2.2 16-2" />
      </IconBase>
    );
  }
  if (name === "users") {
    return (
      <IconBase>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
        <path d="M16 3.2a4 4 0 0 1 0 7.6" />
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
  if (Array.isArray(result.sections)) return result.sections.filter((section) => section.type !== "stats");
  return Object.entries(result.payload || {}).map(([key, value]) => ({
    title: key,
    content: renderValue(value),
    type: "text",
  }));
}

function resultToText(result) {
  if (!result) return "";
  const lines = [result.title, result.subtitle].filter(Boolean);
  for (const section of resultSections(result)) {
    lines.push("", section.title || "Sekcja");
    if (section.content) lines.push(String(section.content));
    if (Array.isArray(section.items)) {
      for (const item of section.items) {
        lines.push(`${item.label}: ${renderValue(item.value)}`);
      }
    }
  }
  return lines.join("\n").trim();
}

function dungeonMapRows(content) {
  return String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[0-9A-Zevu]+$/.test(line));
}

function dungeonRoomNumber(tile) {
  if (/^[A-Z]$/.test(tile)) return tile.charCodeAt(0) - 64;
  if (Number(tile) >= 5) return Number(tile) - 4;
  return null;
}

function dungeonTileClass(tile) {
  if (["e", "u", "v"].includes(tile)) return "tile-stairs";
  return dungeonRoomNumber(tile) ? "tile-roomLabel" : `tile-${tile}`;
}

function dungeonTileLabel(tile) {
  if (tile === "e") return "E";
  if (tile === "u") return "↑";
  if (tile === "v") return "↓";
  const roomNumber = dungeonRoomNumber(tile);
  if (roomNumber) return String(roomNumber);
  return "";
}

function dungeonTileTitle(tile) {
  if (tile === "e") return "Wejście";
  if (tile === "u") return "Przejście na wyższy poziom";
  if (tile === "v") return "Zejście na niższy poziom";
  if (tile === "1") return "Korytarz";
  if (tile === "2") return "Pokój";
  if (tile === "3") return "Korytarz";
  const roomNumber = dungeonRoomNumber(tile);
  if (roomNumber) return `Pokój #${roomNumber}`;
  return "Ściana";
}

function renderDungeonMap(section) {
  const rows = dungeonMapRows(section.content);
  if (!rows.length) return null;
  const legend = Array.isArray(section.items) ? section.items : [];
  return (
    <div className="dungeonMapBlock">
      <div className="dungeonMapViewport" style={{ "--dungeon-cols": rows[0]?.length || 1 }}>
        {rows.map((row, y) => (
          <div className="dungeonMapRow" key={`row-${y}`}>
            {[...row].map((tile, x) => (
              <span
                key={`${x}-${y}`}
                className={`dungeonTile ${dungeonTileClass(tile)}`}
                title={dungeonTileTitle(tile)}
              >
                {dungeonTileLabel(tile)}
              </span>
            ))}
          </div>
        ))}
      </div>
      {legend.length > 0 && (
        <div className="dungeonMapLegend">
          {legend.map((item) => (
            <span key={item.label}>
              <small>{item.label}</small>
              <strong>{renderValue(item.value)}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function dungeonFloorNumber(title) {
  const match = String(title || "").match(/poziom\s+(\d+)/i);
  return match ? Number(match[1]) : 1;
}

function dungeonFloorsFromSections(sections) {
  const maps = sections.filter((section) => section.type === "dungeon_map");
  const hasMultipleFloors = maps.length > 1;
  return maps.map((mapSection, index) => {
    const number = hasMultipleFloors ? dungeonFloorNumber(mapSection.title) : index + 1;
    const roomSection = sections.find((section) => {
      if (section.type !== "dungeon_rooms") return false;
      return hasMultipleFloors ? dungeonFloorNumber(section.title) === number : section.title === "Pomieszczenia";
    });
    return { number, mapSection, roomSection };
  });
}

function renderSectionItems(section) {
  if (!section || !Array.isArray(section.items) || !section.items.length) return null;
  return (
    <div className="generatorWindowStats">
      {section.items.map((item) => (
        <span key={item.label}>
          <small>{item.label}</small>
          <strong>{renderValue(item.value)}</strong>
        </span>
      ))}
    </div>
  );
}

function renderGenericSection(section) {
  const hasItems = Array.isArray(section.items) && section.items.length > 0;
  if (section.type === "table" && hasItems) {
    return (
      <div className="generatorSectionTable">
        {section.items.map((item) => (
          <div key={item.label} className="generatorSectionTableRow">
            <span>{item.label}</span>
            <strong>{renderValue(item.value)}</strong>
          </div>
        ))}
      </div>
    );
  }
  if (section.type === "list" && hasItems) {
    return (
      <ul className="generatorSectionList">
        {section.items.map((item) => (
          <li key={item.label}>
            <strong>{item.label}</strong>
            {item.value !== undefined && item.value !== null ? <span>{renderValue(item.value)}</span> : null}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <>
      {section.content && <p>{section.content}</p>}
      {hasItems && renderSectionItems(section)}
    </>
  );
}

function DungeonFloorTabs({ floors, activeIndex, onChange }) {
  if (!floors.length) return null;
  const safeIndex = Math.min(activeIndex, floors.length - 1);
  const activeFloor = floors[safeIndex] || floors[0];
  return (
    <article className="is-dungeon-floors">
      <div className="dungeonFloorTabs">
        {floors.map((floor, index) => (
          <button
            key={floor.mapSection.title}
            type="button"
            className={index === safeIndex ? "is-active" : ""}
            onClick={() => onChange(index)}
          >
            Poziom {floor.number}
          </button>
        ))}
      </div>
      <div className="dungeonFloorPanel">
        <h3>{activeFloor.mapSection.title}</h3>
        {renderDungeonMap(activeFloor.mapSection)}
        {activeFloor.roomSection && (
          <div className="dungeonFloorRooms">
            <h3>{activeFloor.roomSection.title}</h3>
            {renderSectionItems(activeFloor.roomSection)}
          </div>
        )}
      </div>
    </article>
  );
}

function formatGeneratedAt(value) {
  if (!value) return "Jeszcze nie wygenerowano";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function generatorCategoryId(item) {
  if (!item) return "all";
  const probes = [item.type, item.generatorCode, item.typeCode, item.catalogTypeCode, item.categoryCode, item.category, item.label, item.title]
    .filter(Boolean)
    .map((value) => normalizeText(value));
  for (const probe of probes) {
    if (GENERATOR_CATEGORY_BY_ALIAS[probe]) return GENERATOR_CATEGORY_BY_ALIAS[probe];
    const match = Object.entries(GENERATOR_CATEGORY_BY_ALIAS).find(([alias]) => probe.includes(alias));
    if (match) return match[1];
  }
  return "world";
}

function generatorCategoryLabel(item) {
  const category = GENERATOR_CATEGORY_CONFIG.find((option) => option.value === generatorCategoryId(item));
  return category?.label || "Inne";
}

function safeResultValue(value, fallback = "Brak danych") {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) {
    const parts = value.map((item) => safeResultValue(item, "")).filter(Boolean);
    return parts.length ? parts.join(", ") : fallback;
  }
  if (typeof value === "object") {
    if (value.label || value.value) return [value.label, value.value].filter(Boolean).join(": ");
    return Object.entries(value)
      .map(([key, entry]) => `${key}: ${safeResultValue(entry, "")}`)
      .filter(Boolean)
      .join(", ") || fallback;
  }
  const text = String(value).trim();
  return text || fallback;
}

function findSectionLoose(sections, labels) {
  const normalizedLabels = labels.map(normalizeText);
  return sections.find((section) => {
    const title = normalizeText(section.title);
    return normalizedLabels.some((label) => title === label || title.includes(label) || label.includes(title));
  });
}

function sectionValueLoose(sections, labels) {
  const section = findSectionLoose(sections, labels);
  if (!section) return "";
  if (section.content) return safeResultValue(section.content, "");
  if (Array.isArray(section.items) && section.items.length) {
    return section.items.map((item) => {
      const label = item.label ? `${item.label}: ` : "";
      return `${label}${safeResultValue(item.value, "")}`.trim();
    }).filter(Boolean).join("\n");
  }
  return "";
}

function itemValueLoose(sections, labels) {
  const normalizedLabels = labels.map(normalizeText);
  for (const section of sections) {
    if (!Array.isArray(section.items)) continue;
    const item = section.items.find((entry) => {
      const label = normalizeText(entry.label);
      return normalizedLabels.some((expected) => label === expected || label.includes(expected) || expected.includes(label));
    });
    if (item) return safeResultValue(item.value, "");
  }
  return "";
}

function resultValueFor(sections, labels) {
  return itemValueLoose(sections, labels) || sectionValueLoose(sections, labels);
}

function resultLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanNameLine(value) {
  const text = safeResultValue(value, "").replace(/^\s*(?:\d+|wynik\s*\d+)\s*[:.)-]\s*/i, "").trim();
  if (!text) return "";
  if (/^imiona?\s*:/i.test(text) || /^names?\s*:/i.test(text)) return "";
  return text;
}

function isNameMetadata(value) {
  const normalized = normalizeText(value).trim();
  return ["kultura", "culture", "plec", "gender", "format"].includes(normalized);
}

function isNameResultSection(section) {
  const title = normalizeText(section?.title);
  return section?.type === "table" || title.includes("imion") || title.includes("name") || title.includes("alias");
}

function nameValueFromItem(item) {
  const label = cleanNameLine(item?.label);
  const value = cleanNameLine(item?.value);
  const normalizedValue = normalizeText(value).trim();
  if (label && !isNameMetadata(label)) return label;
  if (value && !["meska", "zenska", "neutralna", "male", "female", "neutral", "losowa"].includes(normalizedValue)) {
    return value;
  }
  return "";
}

function collectNameResults(result, sections) {
  const collected = [];
  sections.forEach((section) => {
    if (isNameResultSection(section) && Array.isArray(section.items)) {
      section.items.forEach((item) => {
        const value = nameValueFromItem(item);
        if (value) collected.push(value);
      });
    }
    if (isNameResultSection(section) && !isNameMetadata(section.title)) {
      resultLines(section.content).forEach((line) => {
        const value = cleanNameLine(line);
        if (value) collected.push(value);
      });
    }
  });

  if (collected.length) return [...new Set(collected)];

  const loose = resultValueFor(sections, ["imiona", "wyniki", "names", "lista"]);
  const looseLines = resultLines(loose).map(cleanNameLine).filter(Boolean);
  if (looseLines.length) return [...new Set(looseLines)];

  const fallback = cleanNameLine(result?.subtitle || result?.title);
  return fallback ? [fallback] : [];
}

const GENERATOR_RESULT_KINDS = {
  name: ["name"],
  npc: ["npc", "coc_investigator_npc"],
  location: ["location", "tavern", "shop_fantasy", "settlement_fantasy", "district_fantasy", "castle_fantasy"],
  organization: ["faction"],
  weather: ["weather"],
  adventure: ["hook", "quest_fantasy", "encounter", "encounter_quick", "complication_quick"],
  loot: ["loot", "loot_fantasy", "magic_item"],
  clue: ["clue", "document_quick"],
  dungeon: ["five_room_dungeon", "dungeon_concept", "dungeon_room"],
  dungeonAdvanced: ["dungeon_advanced"],
  event: ["event_quick", "twist"],
  food: ["food_quick"],
};

const GENERATOR_RESULT_FIELDS = {
  npc: [
    ["Imie", ["imie", "name", "nazwa"]],
    ["Rola", ["rola", "role", "profesja", "zawod"]],
    ["Wyglad", ["wyglad", "appearance"]],
    ["Osobowosc", ["osobowosc", "personality"]],
    ["Sekret", ["sekret", "secret"]],
    ["Haczyk fabularny", ["haczyk", "hook", "motywacja", "motivation"]],
  ],
  location: [
    ["Nazwa lokacji", ["nazwa", "nazwa lokacji", "name"]],
    ["Typ", ["typ", "type"]],
    ["Klimat", ["klimat", "atmosfera", "mood"]],
    ["Opis", ["opis", "description"]],
    ["Wazny detal", ["detal", "wazny detal"]],
    ["Zagrozenie lub tajemnica", ["zagrozenie", "tajemnica", "sekret", "secret"]],
  ],
  organization: [
    ["Nazwa", ["nazwa", "name"]],
    ["Cel", ["cel", "goal"]],
    ["Metody", ["metody", "methods"]],
    ["Zasoby", ["zasoby", "resources"]],
    ["Sekret", ["sekret", "secret"]],
    ["Konflikt", ["konflikt", "conflict"]],
  ],
  weather: [
    ["Opis pogody", ["opis", "pogoda", "weather"]],
    ["Temperatura", ["temperatura", "temperature"]],
    ["Wiatr", ["wiatr", "wind"]],
    ["Opady", ["opady", "deszcz", "precipitation"]],
    ["Efekt na scene", ["efekt", "przy stole", "scena", "scene"]],
  ],
  adventure: [
    ["Problem", ["problem", "co sie dzieje"]],
    ["Zleceniodawca / zrodlo", ["zleceniodawca", "zrodlo", "source"]],
    ["Komplikacja / twist", ["komplikacja", "twist", "zwrot"]],
    ["Pierwszy trop", ["trop", "wskazowka", "wskazowka", "clue"]],
    ["Konsekwencja porazki", ["konsekwencja", "porazka", "failure"]],
  ],
  loot: [
    ["Monety", ["monety", "coins"]],
    ["Glowny przedmiot", ["glowny", "przedmiot", "item"]],
    ["Dziwny detal", ["dziwny", "detal", "quirk"]],
    ["Sekret albo ukryta wlasciwosc", ["sekret", "ukryta", "wlasciwosc"]],
  ],
  clue: [
    ["Dowod / slad", ["dowod", "slad", "clue"]],
    ["Znaczenie", ["znaczenie", "meaning"]],
    ["Ukryty detal", ["ukryty", "detal"]],
    ["Dokad prowadzi", ["dokad", "prowadzi", "leads"]],
  ],
  dungeon: [
    ["Nazwa lochu", ["nazwa", "name"]],
    ["Wejscie", ["wejscie", "entrance"]],
    ["Pokoj 1", ["pokoj 1", "room 1"]],
    ["Pokoj 2", ["pokoj 2", "room 2"]],
    ["Pokoj 3", ["pokoj 3", "room 3"]],
    ["Pokoj 4", ["pokoj 4", "room 4"]],
    ["Pokoj 5", ["pokoj 5", "room 5"]],
  ],
  dungeonAdvanced: [
    ["Nazwa lochu", ["nazwa", "name"]],
    ["Legenda", ["legenda", "legend"]],
    ["Lista pomieszczen", ["pomieszczenia", "rooms"]],
    ["Specjalne zagrozenia", ["zagrozenia", "hazards"]],
    ["Skarb albo cel wyprawy", ["skarb", "cel", "treasure", "goal"]],
  ],
  event: [
    ["Wydarzenie", ["wydarzenie", "event"]],
    ["Uczestnicy", ["uczestnicy", "participants"]],
    ["Miejsce", ["miejsce", "place", "location"]],
    ["Skutek", ["skutek", "effect"]],
    ["Mozliwa reakcja graczy", ["reakcja", "graczy", "reaction"]],
  ],
  food: [
    ["Nazwa potrawy", ["nazwa", "potrawa", "dish"]],
    ["Skladniki", ["skladniki", "ingredients"]],
    ["Smak", ["smak", "taste"]],
    ["Cena albo dostepnosc", ["cena", "dostepnosc", "price"]],
    ["Efekt fabularny", ["efekt", "fabularny", "story"]],
  ],
};

function generatorResultKind(code) {
  const normalized = normalizeText(code);
  for (const [kind, aliases] of Object.entries(GENERATOR_RESULT_KINDS)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) return kind;
  }
  return "generic";
}

function GeneratorResultField({ label, value }) {
  const lines = resultLines(value);
  return (
    <article className="generatorResultField">
      <span>{label}</span>
      {lines.length > 1 ? (
        <ul>{lines.map((line) => <li key={line}>{line}</li>)}</ul>
      ) : (
        <p>{lines[0] || "Brak danych"}</p>
      )}
    </article>
  );
}

function NameGeneratorResult({ result, sections, activeValues, icon }) {
  const displayNames = collectNameResults(result, sections);
  return (
    <section className="generatorTypedResult generatorTypedResult--names">
      <div className="generatorTypedHero">
        <span className="generatorTypedIcon"><GeneratorIcon name={icon || "type"} /></span>
        <div>
          <h2>Wygenerowane imiona i nazwiska</h2>
          <p>
            Kultura: {safeResultValue(activeValues?.culture || activeValues?.Culture, "Losowa")}  - Format: {safeResultValue(activeValues?.nameFormat || activeValues?.format, "Imie + nazwisko")}  - Plec: {safeResultValue(activeValues?.gender, "Losowa")}
          </p>
        </div>
      </div>
      <div className="generatorNameList">
        {(displayNames.length ? displayNames : ["Brak danych"]).map((name, index) => (
          <div key={`${name}-${index}`} className="generatorNameRow">
            <strong>{index + 1}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TypedGeneratorResult({ result, generatorCode, activeValues, icon, displayedSections, dungeonFloors, showDungeonFloorTabs, activeDungeonFloor, setActiveDungeonFloor }) {
  const sections = displayedSections || [];
  const kind = generatorResultKind(generatorCode);
  if (kind === "name") {
    return <NameGeneratorResult result={result} sections={sections} activeValues={activeValues} icon={icon} />;
  }

  const fields = GENERATOR_RESULT_FIELDS[kind];
  const mapSection = sections.find((section) => section.type === "dungeon_map" || section.type === "map");

  return (
    <section className={`generatorTypedResult generatorTypedResult--${kind}`}>
      <div className="generatorTypedHero">
        <span className="generatorTypedIcon"><GeneratorIcon name={icon || "spark"} /></span>
        <div>
          <h2>{safeResultValue(result?.title, "Wynik generatora")}</h2>
          <p>{safeResultValue(result?.subtitle || formatGeneratedAt(result?.generatedAt), "Gotowy wynik")}</p>
        </div>
      </div>

      {showDungeonFloorTabs && (
        <div className="generatorTypedMap">
          <DungeonFloorTabs floors={dungeonFloors} activeIndex={activeDungeonFloor} onChange={setActiveDungeonFloor} />
        </div>
      )}
      {!showDungeonFloorTabs && mapSection && (
        <div className="generatorTypedMap">
          <h3>Mapa</h3>
          {renderDungeonMap(mapSection)}
        </div>
      )}

      {fields ? (
        <div className="generatorTypedFields">
          {fields.map(([label, labels]) => (
            <GeneratorResultField key={label} label={label} value={resultValueFor(sections, labels)} />
          ))}
        </div>
      ) : (
        <div className="generatorWindowSections generatorWindowSections--minimal">
          {sections.length ? sections.map((section, index) => (
            <article key={`${section.title}-${index}`}>
              <h3>{section.title || "Sekcja"}</h3>
              {renderGenericSection(section)}
            </article>
          )) : <GeneratorResultField label="Wynik" value={result?.title || result?.subtitle} />}
        </div>
      )}
    </section>
  );
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
  const [activeDungeonFloor, setActiveDungeonFloor] = useState(0);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTone] = useState("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState("popular");
  const [favoriteKeys, setFavoriteKeys] = useState(() => new Set(readFavoriteKeys()));
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalogFallback, setCatalogFallback] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const definitions = await getGeneratorDefinitions(token, {
          category: "all",
          system: "all",
          type: "all",
          tone: selectedTone,
        });
        const nextCatalog = decorateCatalog(flattenDefinitions(definitions));
        if (cancelled) return;
        setCatalogFallback(false);
        setCatalogError("");
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
      } catch (e) {
        if (!cancelled) {
          const fallback = decorateCatalog(FALLBACK_CATALOG);
          setCatalogFallback(true);
          setCatalogError(e?.message || "Nie udało się pobrać katalogu generatorów z API.");
          setCatalog(fallback);
          setActiveKey((previous) => fallback.some((item) => buildKey(item) === previous) ? previous : fallback[0] ? buildKey(fallback[0]) : "");
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [token, selectedTone, catalogReloadKey]);

  const activeDefinition = useMemo(
    () => catalog.find((item) => buildKey(item) === activeKey) || catalog[0],
    [activeKey, catalog]
  );
  const activeValues = forms[activeKey] || buildInitialParams(activeDefinition);
  const visibleCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    const filtered = catalog.filter((item) => {
      if (favoritesOnly && !favoriteKeys.has(buildKey(item))) return false;
      if (selectedType !== "all" && generatorCategoryId(item) !== selectedType) return false;
      if (!query) return true;
      return [
        item.label,
        item.cardDescription,
        item.cardTag,
        item.categoryCode,
        item.typeLabel,
        item.catalogTypeCode,
        generatorCategoryLabel(item),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filtered].sort((left, right) => {
      const favoriteDelta = Number(favoriteKeys.has(buildKey(right))) - Number(favoriteKeys.has(buildKey(left)));
      if (favoriteDelta !== 0) return favoriteDelta;
      if (catalogSort === "name") return String(left.label).localeCompare(String(right.label), "pl");
      if (catalogSort === "type") return String(left.typeLabel || left.catalogTypeCode || left.type).localeCompare(String(right.typeLabel || right.catalogTypeCode || right.type), "pl");
      return (left.order || 0) - (right.order || 0);
    });
  }, [catalog, catalogSearch, catalogSort, favoriteKeys, favoritesOnly, selectedType]);

  const catalogCountBase = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return catalog.filter((item) => {
      if (favoritesOnly && !favoriteKeys.has(buildKey(item))) return false;
      if (!query) return true;
      return [
        item.label,
        item.cardDescription,
        item.cardTag,
        item.categoryCode,
        item.typeLabel,
        item.catalogTypeCode,
        generatorCategoryLabel(item),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });
  }, [catalog, catalogSearch, favoriteKeys, favoritesOnly]);

  const sidebarTypeFilters = GENERATOR_CATEGORY_CONFIG.map((option) => ({
    ...option,
    count: option.value === "all"
      ? catalogCountBase.length
      : catalogCountBase.filter((item) => generatorCategoryId(item) === option.value).length,
  })).filter((option) => option.value === "all" || option.count > 0);

  function toggleFavorite(generator) {
    const key = buildKey(generator);
    setFavoriteKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      writeFavoriteKeys(next);
      return next;
    });
  }

  useEffect(() => {
    if (!generatorCode || !catalog.length) return;
    const routeTarget = catalog.find((item) => item.type === generatorCode);
    if (!routeTarget) return;
    const nextKey = buildKey(routeTarget);
    setActiveKey((previousKey) => {
      if (previousKey !== nextKey) {
        setResult(null);
        setError("");
      }
      return nextKey;
    });
  }, [catalog, generatorCode]);

  useEffect(() => {
    if (!activeDefinition || activeDefinition.kind !== "variant" || activeDefinition.params?.length) return;
    let cancelled = false;

    async function loadForm() {
      try {
        const form = await getGeneratorForm(token, activeDefinition.generatorCode, activeDefinition.variantCode);
        if (cancelled) return;
        const params = visibleParams((form.fields || []).map((field) => ({
          key: field.key,
          label: field.label,
          inputType: String(field.type || "text").toLowerCase(),
          options: field.options || [],
          defaultValue: field.defaultValue,
          required: field.required,
        })));
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
    setForms((prev) => {
      const current = {
        ...(prev[activeKey] || {}),
        [key]: value,
      };
      const code = activeDefinition?.kind === "variant" ? activeDefinition.generatorCode : activeDefinition?.type;
      if (key === "setting" && code === "npc") {
        current.role = "Losowa";
      }
      if (key === "setting" && code === "location") {
        current.locationType = "Losowy";
      }
      if (key === "setting" && code === "faction") {
        current.factionType = "Losowy";
      }
      if (key === "setting" && code === "clue") {
        current.clueType = "Losowy";
      }
      return {
        ...prev,
        [activeKey]: current,
      };
    });
  }

  function activeGeneratorCode() {
    return activeDefinition?.kind === "variant" ? activeDefinition.generatorCode : activeDefinition?.type;
  }

  function rememberResult(target, generated, values) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      key: buildKey(target),
      generatorCode: target.kind === "variant" ? target.generatorCode : target.type,
      variantCode: target.variantCode || null,
      label: target.label || target.title || target.type,
      tone: target.tone,
      icon: target.icon,
      values,
      result: generated,
      createdAt: new Date().toISOString(),
    };
    const previous = readGeneratorHistory();
    const next = [entry, ...previous].slice(0, GENERATOR_HISTORY_LIMIT);
    writeGeneratorHistory(next);
  }

  async function copyResult() {
    const text = resultToText(result);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Skopiowano");
      setTimeout(() => setCopyStatus(""), 1400);
    } catch {
      setCopyStatus("Nie udało się skopiować");
      setTimeout(() => setCopyStatus(""), 1800);
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
    setResult(null);

    try {
      const values = forms[key] || buildInitialParams(target);
      const generated = target.kind === "variant"
        ? await generateVariantContent(token, target.generatorCode, target.variantCode, values)
        : await generateContent(token, target.system, target.type, values);
      setResult(generated);
      rememberResult(target, generated, values);
      setActiveDungeonFloor(0);
      setResultIsNew(true);
      setTimeout(() => setResultIsNew(false), 600);
    } catch (e) {
      setError(e?.message || "Nie udało się wygenerować treści.");
    } finally {
      setLoading(false);
    }
  }

  if (generatorCode) {
    const sections = resultSections(result);
    const dungeonFloors = dungeonFloorsFromSections(sections);
    const showDungeonFloorTabs = activeGeneratorCode() === "dungeon_advanced" && dungeonFloors.length > 1;
    const displayedSections = showDungeonFloorTabs
      ? sections.filter((section) => section.type !== "dungeon_map" && section.type !== "dungeon_rooms")
      : sections;
    const currentParams = scopedParams(activeDefinition?.params, activeValues, activeGeneratorCode());

    return (
      <div className={`page generatorsPage generatorsDashboard generatorWindowPage generatorWindowPage--${activeDefinition?.tone || "green"}`}>
        <div className="generatorPageActions">
          <button type="button" className="generatorBackButton" onClick={() => navigate("/generators")}>
            {"<- Generatory"}
          </button>
        </div>

        <div className="generatorWindowWorkspace">
          <div className="generatorWindowShell">
            <aside className="generatorSettingsPanel">
              <div className="generatorPanelNumber">1. Ustawienia</div>
              <div className="generatorSettingsIntro">
                <strong>{activeDefinition?.label || "Generator"}</strong>
                <span>{activeDefinition?.cardDescription || activeDefinition?.description || "Dostosuj parametry i wygeneruj wynik."}</span>
              </div>

              <div className="generatorWindowFields">
                {currentParams.length ? (
                  currentParams.map((param) => (
                    <Field key={param.key} param={param} value={activeValues[param.key]} onChange={setFieldValue} />
                  ))
                ) : (
                  <p className="generatorCatalogEmpty">Ten generator nie wymaga dodatkowych ustawien.</p>
                )}
              </div>

              {error && <div className="generatorError">{error}</div>}

              <button className="generatorWindowGenerate" type="button" onClick={() => handleGenerate(activeDefinition)} disabled={loading || catalogLoading}>
                <GeneratorIcon name="spark" />
                <span>{loading ? "Generowanie..." : "Przelosuj"}</span>
              </button>
            </aside>

            <main className="generatorOutputPanel">
              <div className="generatorOutputTop">
                <div className="generatorPanelNumber">2. Wynik</div>
                {result && (
                  <div className="generatorResultActions">
                    <button type="button" onClick={copyResult}>Kopiuj wynik</button>
                    <button type="button" onClick={() => handleGenerate(activeDefinition)} disabled={loading || catalogLoading}>
                      {loading ? "Generowanie..." : "Regeneruj"}
                    </button>
                    {copyStatus && <span>{copyStatus}</span>}
                  </div>
                )}
              </div>

              {result ? (
                <div className={`generatorWindowResult${resultIsNew ? " is-new" : ""}`}>
                  <TypedGeneratorResult
                    result={result}
                    generatorCode={activeGeneratorCode()}
                    activeValues={activeValues}
                    icon={activeDefinition?.icon}
                    displayedSections={displayedSections}
                    dungeonFloors={dungeonFloors}
                    showDungeonFloorTabs={showDungeonFloorTabs}
                    activeDungeonFloor={activeDungeonFloor}
                    setActiveDungeonFloor={setActiveDungeonFloor}
                  />
                </div>
              ) : (
                <div className="generatorWindowEmpty">
                  <GeneratorIcon name={activeDefinition?.icon || "spark"} />
                  <strong>Wynik pojawi sie tutaj</strong>
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
    <div className="page generatorsPage generatorsDashboard generatorsCatalogPage">
      {catalogFallback && (
        <section className="generatorCatalogWarning" role="status">
          <div>
            <strong>Katalog generatorow dziala w trybie awaryjnym.</strong>
            <span>{catalogError || "Nie udalo sie pobrac pelnej listy generatorow z backendu."}</span>
          </div>
          <button type="button" onClick={() => setCatalogReloadKey((value) => value + 1)} disabled={catalogLoading}>
            {catalogLoading ? "Sprawdzam..." : "Sprobuj ponownie"}
          </button>
        </section>
      )}

      <div className="generatorsCatalogLayout">
        <aside className="generatorsSidebar" aria-label="Kategorie generatorow">
          <nav className="generatorsCategoryList">
            {sidebarTypeFilters.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`generatorsCategoryItem${selectedType === option.value ? " is-active" : ""}`}
                onClick={() => setSelectedType(option.value)}
              >
                <span className="generatorsCategoryIcon"><GeneratorIcon name={option.icon || "spark"} /></span>
                <span>{option.label}</span>
                <strong>{option.count}</strong>
              </button>
            ))}
          </nav>
        </aside>

        <main className="generatorsContent">
          <div className="generatorsTopbar">
            <label className="generatorsSearch">
              <span className="generatorsSearchIcon" aria-hidden="true">S</span>
              <input
                type="search"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Szukaj generatorow..."
              />
            </label>
            <button
              type="button"
              className={`generatorsFavoritesButton${favoritesOnly ? " is-active" : ""}`}
              onClick={() => setFavoritesOnly((value) => !value)}
              aria-pressed={favoritesOnly}
            >
              <span aria-hidden="true">{favoritesOnly ? "\u2605" : "\u2606"}</span>
              <span>Ulubione</span>
            </button>
            <label className="generatorsSort">
              <span>Sortuj:</span>
              <select value={catalogSort} onChange={(event) => setCatalogSort(event.target.value)}>
                <option value="popular">Popularnosc</option>
                <option value="name">Nazwa</option>
                <option value="type">Typ</option>
              </select>
            </label>
          </div>

          <section className="generatorsGrid" aria-busy={catalogLoading}>
            {visibleCatalog.map((generator) => {
              const isActive = buildKey(generator) === activeKey;
              const isFavorite = favoriteKeys.has(buildKey(generator));
              return (
                <article key={buildKey(generator)} className={`generatorCard generatorCard--${generator.tone}${isActive ? " is-active" : ""}`}>
                  <button
                    type="button"
                    className={`generatorCardFavorite${isFavorite ? " is-favorite" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(generator);
                    }}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? "Usun z ulubionych" : "Dodaj do ulubionych"}
                    title={isFavorite ? "Usun z ulubionych" : "Dodaj do ulubionych"}
                  >
                    {isFavorite ? "\u2605" : "\u2606"}
                  </button>
                  <button
                    type="button"
                    className="generatorCardBody"
                    onClick={() => navigate(generatorPath(generator))}
                  >
                    <span className="generatorCardIcon">
                      <GeneratorIcon name={generator.icon} />
                    </span>
                    <span className="generatorCardContent">
                      <span className="generatorCardTitle">{generator.label}</span>
                      <span className="generatorCardDescription">{generator.cardDescription || "Praktyczny generator do szybkiego uzycia przy stole."}</span>
                      <span className="generatorCardBadges">
                        <span className="generatorBadge">{generatorCategoryLabel(generator)}</span>
                        <span className="generatorBadge generatorBadge--variant">Opisowy</span>
                      </span>
                    </span>
                  </button>
                </article>
              );
            })}
            {!catalogLoading && visibleCatalog.length === 0 && (
              <div className="generatorCatalogEmpty">
                Brak generatorow dla wybranych filtrow. Zmien kategorie lub wyszukiwana fraze.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );

}
