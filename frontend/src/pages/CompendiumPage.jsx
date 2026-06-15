import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getCompendiumCategories,
  getCompendiumDetail,
  getCompendiumList,
  getCompendiumSystems,
} from "../api/compendium";

const DEFAULT_CATEGORIES = [
  { code: "monsters", label: "Potwory", description: "CR, XP, statystyki i akcje potworów SRD." },
  { code: "spells", label: "Zaklęcia", description: "Poziom, szkoła, komponenty i opis zaklęć SRD." },
  { code: "magic-items", label: "Magiczne przedmioty", description: "Magiczne przedmioty dostępne w SRD." },
  { code: "equipment", label: "Ekwipunek", description: "Bronie, pancerze, sprzęt i koszt." },
  { code: "conditions", label: "Stany", description: "Stany mechaniczne D&D 5E." },
  { code: "skills", label: "Umiejętności", description: "Umiejętności i powiązane cechy." },
  { code: "damage-types", label: "Typy obrażeń", description: "Typy obrażeń z opisami SRD." },
];

const ATTRIBUTE_LABELS = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

const ATTRIBUTE_PATHS = {
  strength: ["strength", "str", "abilities.str", "abilityScores.str"],
  dexterity: ["dexterity", "dex", "abilities.dex", "abilityScores.dex"],
  constitution: ["constitution", "con", "abilities.con", "abilityScores.con"],
  intelligence: ["intelligence", "int", "abilities.int", "abilityScores.int"],
  wisdom: ["wisdom", "wis", "abilities.wis", "abilityScores.wis"],
  charisma: ["charisma", "cha", "abilities.cha", "abilityScores.cha"],
};

function isEmptyValue(value) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function getPath(source, path) {
  if (!source || !path) return undefined;
  return path.split(".").reduce((current, part) => current?.[part], source);
}

function firstValue(source, paths) {
  const candidates = Array.isArray(paths) ? paths : [paths];
  for (const path of candidates) {
    const value = typeof path === "function" ? path(source) : getPath(source, path);
    if (!isEmptyValue(value)) return value;
  }
  return undefined;
}

function asArray(value) {
  if (isEmptyValue(value)) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value, fallback = "Brak danych") {
  if (isEmptyValue(value)) return fallback;
  if (Array.isArray(value)) {
    const normalized = value.map((item) => textValue(item, "")).filter(Boolean);
    return normalized.length ? normalized.join(", ") : fallback;
  }
  if (typeof value === "object") {
    if (value.name) return value.name;
    if (value.index) return value.index;
    if (value.amount !== undefined && value.unit) return `${value.amount} ${value.unit}`;
    if (value.quantity !== undefined && value.unit) return `${value.quantity} ${value.unit}`;
    if (value.desc) return textValue(value.desc, fallback);
    const normalized = Object.values(value).map((item) => textValue(item, "")).filter(Boolean);
    return normalized.length ? normalized.join(" / ") : fallback;
  }
  return String(value);
}

function shortText(value, limit = 86) {
  const text = textValue(value, "Brak danych").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function formatArmorClass(value) {
  const items = asArray(value);
  if (!items.length) return "Brak danych";
  return items.map((item) => {
    if (typeof item === "object") {
      const base = item.value ?? item.armor_class;
      const type = item.type ? ` (${item.type})` : "";
      return base !== undefined ? `${base}${type}` : textValue(item);
    }
    return textValue(item);
  }).join(", ");
}

function formatSpeed(value) {
  if (!value || typeof value !== "object") return textValue(value);
  return Object.entries(value)
    .filter(([, speed]) => !isEmptyValue(speed))
    .map(([mode, speed]) => `${mode}: ${speed}`)
    .join(", ") || "Brak danych";
}

function formatCost(value) {
  if (!value || typeof value !== "object") return textValue(value);
  if (value.quantity !== undefined && value.unit) return `${value.quantity} ${value.unit}`;
  return textValue(value);
}

function formatComponents(item) {
  const components = textValue(item.components);
  const material = item.material ? ` (${item.material})` : "";
  return components === "Brak danych" ? components : `${components}${material}`;
}

function formatAttributes(item) {
  const rows = Object.entries(ATTRIBUTE_LABELS)
    .map(([key, label]) => {
      const score = firstValue(item, ATTRIBUTE_PATHS[key] || key);
      if (score === undefined || score === null) return null;
      const modKey = `${key.slice(0, 3)}_mod`;
      const shortKey = label.toLowerCase();
      const mod = firstValue(item, [modKey, `${shortKey}_mod`, `modifiers.${shortKey}`, `abilityModifiers.${shortKey}`]);
      const modText = mod === undefined || mod === null ? "" : ` (${mod >= 0 ? "+" : ""}${mod})`;
      return `${label} ${score}${modText}`;
    })
    .filter(Boolean);
  return rows.length ? rows.join("  |  ") : "Brak danych";
}

function formatSource(item) {
  const source = item?.source;
  if (!source) return "D&D 5e SRD API";
  if (typeof source === "string") return source;
  return source.name || source.url || "D&D 5e SRD API";
}

function buildField(label, paths, formatter = textValue) {
  return {
    label,
    value: (item) => {
      const value = firstValue(item, paths);
      return formatter === textValue ? textValue(value) : formatter(value, item);
    },
  };
}

function buildTextSection(title, paths, fallback = "Brak opisu") {
  return {
    title,
    kind: "text",
    value: (item) => textValue(firstValue(item, paths), fallback),
  };
}

function buildListSection(title, paths) {
  return {
    title,
    kind: "list",
    value: (item) => asArray(firstValue(item, paths)).map((entry) => textValue(entry, "")).filter(Boolean),
  };
}

const CATEGORY_CONFIG = {
  monsters: {
    badge: "POTWORY",
    columns: [
      buildField("Nazwa", "name"),
      buildField("Typ", "type"),
      buildField("Rozmiar", "size"),
      buildField("AC", "armor_class", formatArmorClass),
      buildField("HP", "hit_points"),
      buildField("CR", "challenge_rating"),
    ],
    facts: [
      buildField("Typ", "type"),
      buildField("Rozmiar", "size"),
      buildField("Klasa pancerza", "armor_class", formatArmorClass),
      buildField("Punkty wytrzymalosci", "hit_points"),
      buildField("Kosci wytrzymalosci", "hit_dice"),
      buildField("Szybkosc", "speed", formatSpeed),
      buildField("Atrybuty", (item) => formatAttributes(item)),
      buildField("Odporności / immunitety", (item) => [
        ...asArray(item.damage_resistances),
        ...asArray(item.damage_immunities),
        ...asArray(item.condition_immunities),
      ]),
    ],
    sections: [buildTextSection("Opis", ["desc", "special_abilities", "actions"], "Brak opisu")],
  },
  spells: {
    badge: "ZAKLECIA",
    columns: [
      buildField("Nazwa", "name"),
      buildField("Poziom", "level"),
      buildField("Szkola", "school"),
      buildField("Czas rzucania", "casting_time"),
      buildField("Zasieg", "range"),
    ],
    facts: [
      buildField("Poziom", "level"),
      buildField("Szkola", "school"),
      buildField("Czas rzucania", "casting_time"),
      buildField("Zasieg", "range"),
      buildField("Komponenty", (item) => formatComponents(item)),
      buildField("Czas trwania", "duration"),
      buildField("Źródło", (item) => formatSource(item)),
    ],
    sections: [
      buildTextSection("Opis", "desc", "Brak opisu"),
      buildTextSection("Efekt na wyzszych poziomach", "higher_level", ""),
    ],
  },
  "magic-items": {
    badge: "MAGICZNE PRZEDMIOTY",
    columns: [
      buildField("Nazwa", "name"),
      buildField("Typ", ["equipment_category", "type"]),
      buildField("Rzadkosc", "rarity"),
      buildField("Kategoria", ["category_range", "gear_category", "equipment_category"]),
    ],
    facts: [
      buildField("Typ / kategoria", ["equipment_category", "type", "gear_category"]),
      buildField("Rzadkosc", "rarity"),
      buildField("Źródło", (item) => formatSource(item)),
    ],
    sections: [
      buildTextSection("Opis", "desc", "Brak opisu"),
      buildListSection("Warianty", ["variants", "contents"]),
    ],
  },
  equipment: {
    badge: "EKWIPUNEK",
    columns: [
      buildField("Nazwa", "name"),
      buildField("Kategoria", ["equipment_category", "gear_category", "weapon_category", "armor_category"]),
      buildField("Koszt", "cost", formatCost),
      buildField("Waga", "weight"),
    ],
    facts: [
      buildField("Kategoria", ["equipment_category", "gear_category", "weapon_category", "armor_category"]),
      buildField("Koszt", "cost", formatCost),
      buildField("Waga", "weight"),
      buildField("Źródło", (item) => formatSource(item)),
    ],
    sections: [
      buildTextSection("Opis", "desc", "Brak opisu"),
      buildListSection("Specjalne wlasciwosci", ["properties", "special"]),
    ],
  },
  conditions: {
    badge: "STANY",
    columns: [
      buildField("Nazwa", "name"),
      buildField("Krotki opis", "desc", (value) => shortText(value)),
    ],
    facts: [buildField("Źródło", (item) => formatSource(item))],
    sections: [buildTextSection("Opis efektu", "desc", "Brak opisu")],
  },
  skills: {
    badge: "UMIEJETNOSCI",
    columns: [
      buildField("Nazwa", "name"),
      buildField("Atrybut", "ability_score"),
      buildField("Krotki opis", "desc", (value) => shortText(value)),
    ],
    facts: [
      buildField("Powiazany atrybut", "ability_score"),
      buildField("Źródło", (item) => formatSource(item)),
    ],
    sections: [buildTextSection("Opis", "desc", "Brak opisu")],
  },
  "damage-types": {
    badge: "TYPY OBRAZEN",
    columns: [
      buildField("Nazwa", "name"),
      buildField("Krotki opis", "desc", (value) => shortText(value)),
    ],
    facts: [buildField("Źródło", (item) => formatSource(item))],
    sections: [buildTextSection("Opis", "desc", "Brak opisu")],
  },
};

const FALLBACK_CONFIG = {
  badge: "KOMPENDIUM",
  columns: [
    buildField("Nazwa", "name"),
    buildField("Opis", "desc", (value) => shortText(value)),
  ],
  facts: [buildField("Źródło", (item) => formatSource(item))],
  sections: [buildTextSection("Opis", "desc", "Brak opisu")],
};

function categoryConfig(categoryCode) {
  return CATEGORY_CONFIG[categoryCode] || FALLBACK_CONFIG;
}

function normalizeListData(data, systemCode, category) {
  if (Array.isArray(data)) {
    return {
      systemCode,
      category,
      count: data.length,
      results: data,
    };
  }
  return {
    ...data,
    systemCode: data?.systemCode || systemCode,
    category: data?.category || category,
    count: data?.count ?? (Array.isArray(data?.results) ? data.results.length : 0),
    results: Array.isArray(data?.results) ? data.results : [],
  };
}

function mergeItemWithDetail(item, detailCache) {
  return detailCache[item.index] ? { ...item, ...detailCache[item.index] } : item;
}

function renderSection(section, detail) {
  const value = section.value(detail);
  if (section.kind === "list") {
    if (!value.length) return null;
    return (
      <section key={section.title} className="compendiumDetailSection">
        <h3>{section.title}</h3>
        <ul>
          {value.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    );
  }
  if (!value) return null;
  return (
    <section key={section.title} className="compendiumDetailSection">
      <h3>{section.title}</h3>
      <p>{value}</p>
    </section>
  );
}

export default function CompendiumPage() {
  const { token } = useAuth();
  const [systems, setSystems] = useState([]);
  const [systemCode, setSystemCode] = useState("dnd5e");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState("monsters");
  const [listData, setListData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [listNotice, setListNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadBase() {
      try {
        const [systemItems, categoryItems] = await Promise.all([
          getCompendiumSystems(token).catch(() => []),
          getCompendiumCategories(token, systemCode).catch(() => DEFAULT_CATEGORIES),
        ]);
        if (cancelled) return;
        setSystems(Array.isArray(systemItems) ? systemItems : []);
        setCategories(Array.isArray(categoryItems) && categoryItems.length ? categoryItems : DEFAULT_CATEGORIES);
      } catch {
        if (!cancelled) setError("Nie udało się pobrać konfiguracji kompendium.");
      }
    }
    loadBase();
    return () => {
      cancelled = true;
    };
  }, [systemCode, token]);

  useEffect(() => {
    let cancelled = false;
    async function loadDetail(index, fallbackItem = null) {
      setDetailLoading(true);
      try {
        const data = await getCompendiumDetail(token, systemCode, category, index);
        if (cancelled) return;
        const nextDetail = data || fallbackItem;
        setDetail(nextDetail);
        if (nextDetail?.index) {
          setDetailCache((current) => ({ ...current, [nextDetail.index]: nextDetail }));
        }
      } catch {
        if (!cancelled) setDetail(fallbackItem);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    async function loadList() {
      setLoading(true);
      setError("");
      setListNotice("");
      setDetail(null);
      setDetailCache({});
      try {
        const data = await getCompendiumList(token, systemCode, category);
        if (cancelled) return;
        const normalizedData = normalizeListData(data, systemCode, category);
        setListData(normalizedData);
        const first = normalizedData.results[0] || null;
        if (first?.index) {
          loadDetail(first.index, first);
        }
      } catch (e) {
        if (!cancelled) {
          setListData({ results: [], count: 0 });
          setListNotice("Brak danych dla tej kategorii.");
          if (e?.status && Number(e.status) >= 500) {
            setError("Nie udało się pobrać danych kompendium.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadList();
    return () => {
      cancelled = true;
    };
  }, [category, systemCode, token]);

  const activeCategory = categories.find((item) => item.code === category) || categories[0] || DEFAULT_CATEGORIES[0];
  const config = categoryConfig(category);

  const rows = useMemo(() => {
    const items = Array.isArray(listData?.results) ? listData.results : [];
    const needle = query.trim().toLowerCase();
    return items
      .map((item) => mergeItemWithDetail(item, detailCache))
      .filter((item) => {
        if (!needle) return true;
        return String(item.name || item.index || "").toLowerCase().includes(needle);
      });
  }, [detailCache, listData, query]);

  async function selectDetail(item) {
    if (!item?.index) return;
    if (detailCache[item.index]) {
      setDetail({ ...item, ...detailCache[item.index] });
      return;
    }
    setDetailLoading(true);
    setError("");
    try {
      const data = await getCompendiumDetail(token, systemCode, category, item.index);
      const nextDetail = data || item;
      setDetail(nextDetail);
      setDetailCache((current) => ({ ...current, [item.index]: nextDetail }));
    } catch (e) {
      setDetail(item);
      setError(e?.message || "Nie udało się pobrać szczegółów.");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="page compendiumPage">
      <section className="compendiumToolbar" aria-label="Filtry kompendium">
        <label>
          <span>System</span>
          <select value={systemCode} onChange={(event) => setSystemCode(event.target.value)}>
            {(systems.length ? systems : [{ code: "dnd5e", name: "D&D 5E" }]).map((system) => (
              <option key={system.code} value={system.code}>{system.name}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="compendiumLayout">
        <aside className="compendiumCategories" aria-label="Kategorie kompendium">
          <label className="compendiumCategorySearch">
            <span className="compendiumCategorySearchIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M11 19a8 8 0 1 1 5.7-2.4L21 21" />
              </svg>
            </span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj wpisów..." />
          </label>
          <div className="compendiumCategoryList">
            {categories.map((item) => (
              <button key={item.code} type="button" className={item.code === category ? "is-active" : ""} onClick={() => setCategory(item.code)}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="compendiumTablePanel">
          <div className="compendiumPanelHeader">
            <div>
              <h2>{activeCategory?.label}</h2>
              <p>{listData?.count ?? rows.length} wpisów</p>
            </div>
          </div>

          {error && <div className="compendiumError">{error}</div>}
          {loading ? (
            <div className="compendiumEmpty">Ładowanie danych...</div>
          ) : (
            <div className="compendiumTableWrap">
              <table className="compendiumTable">
                <thead>
                  <tr>
                    {config.columns.map((column) => <th key={column.label}>{column.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={config.columns.length}>{listNotice || "Brak danych dla tej kategorii."}</td>
                    </tr>
                  ) : null}
                  {rows.map((item) => (
                    <tr key={item.index || item.name} className={detail?.index === item.index ? "is-active" : ""} onClick={() => selectDetail(item)}>
                      {config.columns.map((column) => (
                        <td key={column.label}>{column.value(item)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <aside className="compendiumDetailPanel">
          {detailLoading ? (
            <div className="compendiumEmpty">Ładowanie szczegółów...</div>
          ) : detail ? (
            <>
              <div className="compendiumDetailTitle">
                <span>{config.badge}</span>
                <h2>{detail.name || "Bez nazwy"}</h2>
              </div>
              <div className="compendiumDetailContent">
                <div className="compendiumDetailFacts">
                  {config.facts
                    .map((field) => ({ label: field.label, value: field.value(detail) }))
                    .filter((field) => !isEmptyValue(field.value) && field.value !== "Brak danych")
                    .map((field) => (
                      <div key={field.label}>
                        <strong>{field.label}</strong>
                        <span>{textValue(field.value)}</span>
                      </div>
                    ))}
                </div>
                {config.sections.map((section) => renderSection(section, detail))}
              </div>
            </>
          ) : (
            <div className="compendiumEmpty">Wybierz wpis z tabeli.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
