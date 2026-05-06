import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import "../styles/rules.css";

const SYSTEMS = [
  { code: "dnd",       label: "D&D 5e" },
  { code: "cthulhu",   label: "Call of Cthulhu 7e" },
  { code: "wh4e",      label: "Warhammer 4ed" },
  { code: "pf2e",      label: "Pathfinder 2ed" },
  { code: "morkborg",  label: "Mork Borg" },
  { code: "swade",     label: "Savage Worlds" },
  { code: "alien",     label: "Alien RPG" },
];

const CATEGORIES = [
  { code: "", label: "Wszystkie" },
  { code: "basics", label: "Podstawy" },
  { code: "combat", label: "Walka" },
  { code: "magic", label: "Magia" },
  { code: "horror", label: "Horror" },
  { code: "reference", label: "Reference" },
];

function normalizeContent(text) {
  if (!text) return "";
  return String(text).replace(/\\n/g, "\n");
}

export default function RulesPage() {
  const { token } = useAuth();

  const [selectedSystem, setSelectedSystem] = useState(() => {
    if (typeof window === "undefined") return "dnd";
    try {
      return window.sessionStorage.getItem("rulesSelectedSystem") || "dnd";
    } catch {
      return "dnd";
    }
  });
  const [rules, setRules] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("rulesSelectedSystem", selectedSystem);
    } catch {
      // ignore
    }
  }, [selectedSystem]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setExpandedId(null);
      setExpandAll(false);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set("category", selectedCategory);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const suffix = params.toString() ? `?${params.toString()}` : "";
        const data = await http(`/api/rules/${selectedSystem}${suffix}`, { token });
        if (!cancelled) setRules(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setError(`Nie udało się pobrać zasad dla systemu ${selectedSystem}.`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedSystem, selectedCategory, searchQuery, token]);

  const selectedLabel =
    SYSTEMS.find((s) => s.code === selectedSystem)?.label || selectedSystem;

  function toggleRule(ruleId) {
    if (expandAll) {
      setExpandedId(null);
      setExpandAll(false);
    } else {
      setExpandedId((prev) => (prev === ruleId ? null : ruleId));
    }
  }

  function toggleExpandAll() {
    setExpandAll(!expandAll);
    if (!expandAll) {
      setExpandedId(null);
    }
  }

  const filteredRules = rules;
  const quickRefs = filteredRules.filter((r) => r.quickRef);

  return (
    <div className="page rulesPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">baza wiedzy</span>
          <h1 className="pageTitle">Zasady TTRPG</h1>
          <p className="pageSubtitle">Zasady dla każdego systemu TTRPG</p>
        </div>
      </div>

      <div className="rulesContainer">
        <div className="rulesSystemFilter">
          <div className="rulesFilterLabel">Wybierz system:</div>
          <div className="rulesSystemButtons">
            {SYSTEMS.map((system) => (
              <button
                key={system.code}
                type="button"
                onClick={() => setSelectedSystem(system.code)}
                className={selectedSystem === system.code ? "rulesSystemBtn--active" : ""}
              >
                {system.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="rulesSystemTitle">{selectedLabel}</h2>

          {!loading && !error && rules.length > 0 && (
            <div className="rulesSearchRow">
              <input
                type="text"
                className="rulesSearchInput"
                placeholder="Szukaj w zasadach…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="rulesSearchInput rulesCategorySelect"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                aria-label="Filtr kategorii"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.code || "all"} value={category.code}>
                    {category.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rulesExpandAllBtn"
                onClick={toggleExpandAll}
              >
                {expandAll ? "Zawiń wszystko" : "Rozwiń wszystko"}
              </button>
            </div>
          )}

          {loading && <p>Ładowanie…</p>}
          {!loading && error && <div className="rulesError">{error}</div>}

          {!loading && !error && (
            <div className="rulesCards">
              {quickRefs.length > 0 && (
                <section className="rulesQuickRef" aria-label="Quick reference">
                  {quickRefs.slice(0, 4).map((rule) => (
                    <button
                      key={`quick-${rule.id ?? rule.slug}`}
                      type="button"
                      className="rulesQuickRefItem"
                      onClick={() => {
                        setExpandedId(rule.id ?? rule.slug ?? rule.title);
                        setExpandAll(false);
                      }}
                    >
                      <span>{rule.title}</span>
                      <small>{rule.summary || "Szybka referencja"}</small>
                    </button>
                  ))}
                </section>
              )}

              {filteredRules.length === 0 && rules.length === 0 ? (
                <p>Brak wpisów dla wybranego systemu.</p>
              ) : filteredRules.length === 0 ? (
                <p>Brak wyników dla zapytania „{searchQuery}".</p>
              ) : (
                filteredRules.map((r) => {
                  const id = r.id ?? r.slug ?? r.title;
                  const isOpen = expandAll || expandedId === id;
                  return (
                    <article
                      key={id}
                      className={"rulesCard" + (isOpen ? " is-open" : "")}
                    >
                      <button
                        type="button"
                        className="rulesCardHeader"
                        onClick={() => toggleRule(id)}
                        aria-expanded={isOpen}
                      >
                        <span className="rulesCardTitle">{r.title ?? "Sekcja"}</span>
                        {r.category && <span className="rulesCategoryBadge">{r.category}</span>}
                        <span className="rulesCardChevron"></span>
                      </button>

                      {isOpen && (
                        <div className="rulesCardBody">
                          {r.summary && <p className="rulesSummary">{r.summary}</p>}
                          {normalizeContent(r.content ?? r.text ?? "")}
                          {r.sourceLabel && <div className="rulesSource">Źródło: {r.sourceLabel}</div>}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
