import { useEffect, useMemo, useState } from "react";
import { BASIC_RULES, BASIC_RULES_BY_API_CODE } from "../data/basicRules";
import { RULES_STARTER_RESOURCES } from "../data/rulesResources";
import "../styles/rules.css";

const SECTION_DEFS = [
  { key: "overview", label: "Czym jest ten system?" },
  { key: "core-test", label: "Podstawowa mechanika testow" },
  { key: "character-creation", label: "Tworzenie postaci w skrócie" },
  { key: "combat", label: "Walka w skrocie" },
  { key: "health", label: "Zdrowie i obrazenia" },
  { key: "progression", label: "Rozwój postaci" },
  { key: "game-flow", label: "Minimalny flow gry" },
];

function shortDescription(profile) {
  return profile.sections?.overview || profile.legalNote || "Krotki opis systemu RPG i jego podstawowego stylu gry.";
}

function legalResources(profile, starterResources) {
  const sourceRows = (profile.sources || []).map((source) => ({
    name: source.name,
    url: source.url,
  }));
  const starterRows = starterResources.map((resource) => ({
    name: resource.label,
    url: resource.url,
  }));

  const seen = new Set();
  return [...sourceRows, ...starterRows].filter((row) => {
    const key = `${row.name}-${row.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return row.name && row.url;
  });
}

export default function RulesPage() {
  const [selectedSystem, setSelectedSystem] = useState(() => {
    if (typeof window === "undefined") return BASIC_RULES[0].rulesApiCode;
    try {
      return window.sessionStorage.getItem("rulesSelectedSystem") || BASIC_RULES[0].rulesApiCode;
    } catch {
      return BASIC_RULES[0].rulesApiCode;
    }
  });
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState({ overview: true });

  useEffect(() => {
    try {
      window.sessionStorage.setItem("rulesSelectedSystem", selectedSystem);
    } catch {
      // Session storage can be unavailable in private browsing.
    }
  }, [selectedSystem]);

  const selectedProfile = useMemo(() => {
    return BASIC_RULES_BY_API_CODE[selectedSystem] || BASIC_RULES[0];
  }, [selectedSystem]);

  const filteredSystems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return BASIC_RULES.filter((system) => !needle || system.name.toLowerCase().includes(needle));
  }, [query]);

  const visibleSections = useMemo(() => {
    return SECTION_DEFS.filter((section) => selectedProfile.sections?.[section.key]);
  }, [selectedProfile]);

  useEffect(() => {
    setOpenSections({ overview: true });
  }, [selectedSystem]);

  const starterResources = [...(RULES_STARTER_RESOURCES[selectedSystem] || [])].sort((a, b) => (a.priority || 999) - (b.priority || 999));
  const resources = legalResources(selectedProfile, starterResources);

  function selectSystem(systemCode) {
    setSelectedSystem(systemCode);
  }

  function toggleSection(key) {
    setOpenSections((current) => (current[key] ? {} : { [key]: true }));
  }

  return (
    <div className="page rulesPage">
      <div className="rulesContainer">
        <aside className="rulesSystemFilter" aria-label="Lista systemow">
          <div className="rulesSearchBox">
            <svg className="rulesSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="rulesSearchInput"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj systemu..."
              aria-label="Szukaj systemu"
            />
            {query ? (
              <button className="rulesSearchClear" type="button" onClick={() => setQuery("")} aria-label="Wyczysc wyszukiwanie">
                x
              </button>
            ) : null}
          </div>

          <div className="rulesSystemList" role="listbox" aria-label="Systemy RPG">
            {filteredSystems.length === 0 ? (
              <div className="rulesEmpty">Brak systemow dla tej frazy.</div>
            ) : filteredSystems.map((system) => {
              const active = selectedSystem === system.rulesApiCode;
              return (
                <button
                  key={system.rulesApiCode}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`rulesSystemItem${active ? " is-active" : ""}`}
                  onClick={() => selectSystem(system.rulesApiCode)}
                >
                  {system.name}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="rulesReaderPanel">
          <div className="rulesReaderContent">
            <header className="rulesReaderHeader">
              <h2>{selectedProfile.name}</h2>
              <p>{shortDescription(selectedProfile)}</p>
            </header>

            <section className="rulesAccordion" aria-label="Sekcje zasad">
              {visibleSections.map((section) => {
                const isOpen = Boolean(openSections[section.key]);
                return (
                  <article key={section.key} className={`rulesAccordionItem${isOpen ? " is-open" : ""}`}>
                    <button
                      type="button"
                      className="rulesAccordionHeader"
                      onClick={() => toggleSection(section.key)}
                      aria-expanded={isOpen}
                    >
                      <span>{section.label}</span>
                      <span className="rulesAccordionChevron" aria-hidden="true" />
                    </button>
                    {isOpen ? (
                      <div className="rulesAccordionBody">
                        <p>{selectedProfile.sections?.[section.key] || "Brak lokalnego opisu tej sekcji."}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </section>

            <section className="rulesLegalBox" aria-label="Legalne zrodla">
              <h3>Legalne zrodla</h3>
              {resources.length === 0 ? (
                <p>Brak zdefiniowanych zrodel dla tego systemu.</p>
              ) : (
                <ul>
                  {resources.map((resource) => (
                    <li key={`${resource.name}-${resource.url}`}>
                      {resource.url === "#" ? (
                        <span>{resource.name}</span>
                      ) : (
                        <a href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
