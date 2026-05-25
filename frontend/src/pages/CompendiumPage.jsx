import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getCompendiumCategories,
  getCompendiumDetail,
  getCompendiumList,
  getCompendiumSystems,
} from "../api/compendium";

const DEFAULT_CATEGORIES = [
  { code: "monsters", label: "Potwory", description: "CR, XP, statystyki i akcje potworow SRD." },
  { code: "spells", label: "Zaklecia", description: "Poziom, szkola, komponenty i opis zaklec SRD." },
  { code: "magic-items", label: "Magiczne przedmioty", description: "Magiczne przedmioty dostepne w SRD." },
  { code: "equipment", label: "Ekwipunek", description: "Bronie, pancerze, sprzet i koszt." },
  { code: "conditions", label: "Stany", description: "Stany mechaniczne D&D 5E." },
];

function textValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map(textValue).join(", ");
  if (typeof value === "object") {
    if (value.name) return value.name;
    if (value.amount !== undefined && value.unit) return `${value.amount} ${value.unit}`;
    if (value.quantity !== undefined && value.unit) return `${value.quantity} ${value.unit}`;
    return Object.values(value).map(textValue).filter(Boolean).join(" / ");
  }
  return String(value);
}

function detailRows(detail) {
  if (!detail) return [];
  const priority = [
    "name",
    "index",
    "level",
    "school",
    "casting_time",
    "range",
    "duration",
    "components",
    "challenge_rating",
    "xp",
    "type",
    "size",
    "alignment",
    "armor_class",
    "hit_points",
    "hit_dice",
    "speed",
    "equipment_category",
    "cost",
    "weight",
    "rarity",
    "desc",
  ];
  const hidden = new Set(["url", "updated_at", "image", "source", "systemCode", "category"]);
  const keys = [
    ...priority.filter((key) => detail[key] !== undefined),
    ...Object.keys(detail).filter((key) => !priority.includes(key) && !hidden.has(key)),
  ];
  return keys
    .filter((key) => !hidden.has(key))
    .map((key) => [key, detail[key]]);
}

function prettyKey(key) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CompendiumPage() {
  const { token } = useAuth();
  const [systems, setSystems] = useState([]);
  const [systemCode, setSystemCode] = useState("dnd5e");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState("monsters");
  const [listData, setListData] = useState(null);
  const [detail, setDetail] = useState(null);
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
        if (!cancelled) setError("Nie udalo sie pobrac konfiguracji kompendium.");
      }
    }
    loadBase();
    return () => {
      cancelled = true;
    };
  }, [systemCode, token]);

  useEffect(() => {
    let cancelled = false;
    async function loadList() {
      setLoading(true);
      setError("");
      setListNotice("");
      setDetail(null);
      try {
        const data = await getCompendiumList(token, systemCode, category);
        if (cancelled) return;
        setListData(data);
        const first = Array.isArray(data?.results) ? data.results[0] : null;
        if (first?.index) {
          loadDetail(first.index);
        }
      } catch (e) {
        if (!cancelled) {
          setListData({ results: [], count: 0 });
          setListNotice("Brak danych dla tej kategorii.");
          if (e?.status && Number(e.status) >= 500) {
            setError("Nie udalo sie pobrac danych kompendium.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadDetail(index) {
      setDetailLoading(true);
      try {
        const data = await getCompendiumDetail(token, systemCode, category, index);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    loadList();
    return () => {
      cancelled = true;
    };
  }, [category, systemCode, token]);

  const rows = useMemo(() => {
    const items = Array.isArray(listData?.results) ? listData.results : [];
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => String(item.name || item.index || "").toLowerCase().includes(needle));
  }, [listData, query]);

  const activeCategory = categories.find((item) => item.code === category) || categories[0] || DEFAULT_CATEGORIES[0];

  async function selectDetail(item) {
    if (!item?.index) return;
    setDetailLoading(true);
    setError("");
    try {
      const data = await getCompendiumDetail(token, systemCode, category, item.index);
      setDetail(data);
    } catch (e) {
      setError(e?.message || "Nie udalo sie pobrac szczegolow.");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="page compendiumPage">
      <header className="pageHeader compendiumHero">
        <div>
          <span className="pageEyebrow">baza wiedzy</span>
          <h1 className="pageTitle">Kompendium</h1>
          <p className="pageSubtitle">Baza referencyjna systemow RPG: potwory, zaklecia, przedmioty, stany i zasady z legalnych zrodel SRD.</p>
        </div>
      </header>

      <section className="compendiumToolbar">
        <label>
          <span>System</span>
          <select value={systemCode} onChange={(event) => setSystemCode(event.target.value)}>
            {(systems.length ? systems : [{ code: "dnd5e", name: "D&D 5E" }]).map((system) => (
              <option key={system.code} value={system.code}>{system.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Szukaj</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nazwa wpisu..." />
        </label>
      </section>

      <div className="compendiumLayout">
        <aside className="compendiumCategories">
          {categories.map((item) => (
            <button key={item.code} type="button" className={item.code === category ? "is-active" : ""} onClick={() => setCategory(item.code)}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </aside>

        <main className="compendiumTablePanel">
          <div className="compendiumPanelHeader">
            <div>
              <h2>{activeCategory?.label}</h2>
              <p>{listData?.count ?? rows.length} wpisow z D&D 5E SRD API.</p>
            </div>
            <a href="https://www.dnd5eapi.co/" target="_blank" rel="noreferrer">Zrodlo</a>
          </div>

          {error && <div className="compendiumError">{error}</div>}
          {loading ? (
            <div className="compendiumEmpty">Ladowanie danych...</div>
          ) : (
            <div className="compendiumTableWrap">
              <table className="compendiumTable">
                <thead>
                  <tr>
                    <th>Nazwa</th>
                    <th>Index</th>
                    <th>API</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={3}>{listNotice || "Brak danych dla tej kategorii."}</td>
                    </tr>
                  ) : null}
                  {rows.map((item) => (
                    <tr key={item.index} className={detail?.index === item.index ? "is-active" : ""} onClick={() => selectDetail(item)}>
                      <td>{item.name}</td>
                      <td>{item.index}</td>
                      <td>{item.url}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <aside className="compendiumDetailPanel">
          {detailLoading ? (
            <div className="compendiumEmpty">Ladowanie szczegolow...</div>
          ) : detail ? (
            <>
              <div className="compendiumDetailTitle">
                <span>{activeCategory?.label}</span>
                <h2>{detail.name}</h2>
              </div>
              <div className="compendiumDetailRows">
                {detailRows(detail).map(([key, value]) => (
                  <div key={key} className={key === "desc" ? "is-wide" : ""}>
                    <strong>{prettyKey(key)}</strong>
                    <span>{textValue(value)}</span>
                  </div>
                ))}
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

function CompendiumIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19a3 3 0 0 1 3-3h13" />
      <path d="M7 16V5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 1-2-2Z" />
      <path d="M10 7h6" />
      <path d="M10 11h5" />
    </svg>
  );
}
