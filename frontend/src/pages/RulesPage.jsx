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
      setSearchQuery("");
      setExpandAll(false);
      try {
        const data = await http(`/api/rules/${selectedSystem}`, { token });
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
  }, [selectedSystem, token]);

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

  const filteredRules = rules.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = (r.title || "").toLowerCase();
    const content = (r.content || r.text || "").toLowerCase();
    return title.includes(query) || content.includes(query);
  });

  return (
    <div className="page rulesPage">
      <div className="pageHeader">
        <div>
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
                        <span className="rulesCardChevron"></span>
                      </button>

                      {isOpen && (
                        <div className="rulesCardBody">
                          {normalizeContent(r.content ?? r.text ?? "")}
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
