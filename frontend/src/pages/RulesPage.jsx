import { useEffect, useMemo, useState } from "react";
import { BASIC_RULES, BASIC_RULES_BY_API_CODE } from "../data/basicRules";
import { RULES_STARTER_RESOURCES } from "../data/rulesResources";
import "../styles/rules.css";

const SECTION_DEFS = [
  { key: "overview", label: "Czym jest ten system?", generalLabel: "Czym sa gry RPG?" },
  { key: "core-test", label: "Podstawowa mechanika testow", generalLabel: "Testy, decyzje i konsekwencje" },
  { key: "character-creation", label: "Tworzenie postaci w skrocie", generalLabel: "Rola gracza i postac gracza" },
  { key: "combat", label: "Walka w skrocie", generalLabel: "Rola Mistrza Gry" },
  { key: "health", label: "Zdrowie i obrazenia", generalLabel: "Jak wyglada typowa sesja?" },
  { key: "progression", label: "Rozwoj postaci", generalLabel: "Odgrywanie postaci i wspolna historia" },
  { key: "game-flow", label: "Minimalny flow gry", generalLabel: "Kampanie, sceny i dluzsza gra" },
  { key: "dice-rolls", label: "Rzuty koscmi", generalLabel: "Kosci i rozne systemy RPG" },
];

export default function RulesPage() {
  const [selectedSystem, setSelectedSystem] = useState(() => {
    if (typeof window === "undefined") return BASIC_RULES[0].rulesApiCode;
    try {
      return window.sessionStorage.getItem("rulesSelectedSystem") || BASIC_RULES[0].rulesApiCode;
    } catch {
      return BASIC_RULES[0].rulesApiCode;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem("rulesSelectedSystem", selectedSystem);
    } catch {
      // ignore
    }
  }, [selectedSystem]);

  const selectedProfile = useMemo(() => {
    return BASIC_RULES_BY_API_CODE[selectedSystem] || BASIC_RULES[0];
  }, [selectedSystem]);

  const starterResources = [...(RULES_STARTER_RESOURCES[selectedSystem] || [])].sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return (
    <div className="page rulesPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">baza wiedzy</span>
          <h1 className="pageTitle">Zasady TTRPG</h1>
          <p className="pageSubtitle">
            Podstawowe zasady do rozpoczecia gry. Aplikacja prezentuje tylko wlasne streszczenia, legalne linki i minimalne podstawy, nie pelne podreczniki.
          </p>
        </div>
      </div>

      <div className="rulesContainer">
        <div className="rulesSystemFilter">
          <div className="rulesFilterLabel">Wybierz system:</div>
          <div className="rulesSystemButtons">
            {BASIC_RULES.map((system) => (
              <button
                key={system.rulesApiCode}
                type="button"
                onClick={() => setSelectedSystem(system.rulesApiCode)}
                className={selectedSystem === system.rulesApiCode ? "rulesSystemBtn--active" : ""}
              >
                {system.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="rulesSystemTitle">{selectedProfile.name}</h2>

          <section className="rulesCards" aria-label="Basic rules sections">
            {SECTION_DEFS.map((section) => (
              selectedProfile.sections?.[section.key] ? (
              <article className="rulesCard is-open" key={section.key}>
                <div className="rulesCardHeader">
                  <span className="rulesCardTitle">{selectedProfile.rulesApiCode === "general" ? section.generalLabel : section.label}</span>
                </div>
                <div className="rulesCardBody">
                  <p className="rulesSummary">{selectedProfile.sections?.[section.key] || "Brak lokalnego opisu tej sekcji."}</p>
                </div>
              </article>
              ) : null
            ))}
          </section>

          <div className="rulesSource">
            Legalne zrodla:
            <ul>
              {selectedProfile.sources.map((link) => (
                <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.name}</a></li>
              ))}
            </ul>
          </div>

          <div className="rulesSource"><small>{selectedProfile.legalNote}</small></div>

          <h3 className="rulesSystemTitle">Oficjalne materialy startowe</h3>
          {selectedSystem === "wh4e" && (
            <p className="rulesSummary">
              Dla WFRP 4e nie dodano pelnego darmowego SRD. Ponizsze linki prowadza do oficjalnych darmowych materialow pomocniczych.
            </p>
          )}
          <section className="rulesCards" aria-label="Starter resources">
            {starterResources.map((resource) => (
              <article className="rulesCard is-open" key={resource.url}>
                <div className="rulesCardHeader">
                  <span className="rulesCardTitle">{resource.label}</span>
                  <span className="rulesCategoryBadge">{resource.type}</span>
                </div>
                <div className="rulesCardBody">
                  <p className="rulesSummary"><strong>Zrodlo:</strong> {resource.sourceName}</p>
                  <p className="rulesSummary">{resource.description}</p>
                  <p className="rulesSummary"><strong>Uwagi:</strong> {resource.usageNote}</p>
                  <a
                    className="rulesExpandAllBtn"
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {String(resource.type).includes("pdf") ? "Pobierz / otworz PDF" : "Otworz zrodlo"}
                  </a>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
