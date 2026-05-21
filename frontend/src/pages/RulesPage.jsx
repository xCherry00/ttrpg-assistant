import { useEffect, useMemo, useState } from "react";
import { BASIC_RULES, BASIC_RULES_BY_API_CODE, STATUS_LABELS } from "../data/basicRules";
import "../styles/rules.css";

const SECTION_DEFS = [
  { key: "overview", label: "Czym jest ten system?" },
  { key: "core-test", label: "Podstawowa mechanika testow" },
  { key: "character-creation", label: "Tworzenie postaci w skrocie" },
  { key: "combat", label: "Walka w skrocie" },
  { key: "health", label: "Zdrowie i obrazenia" },
  { key: "progression", label: "Rozwoj postaci" },
  { key: "game-flow", label: "Minimalny flow gry" },
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

  const statusLabel = STATUS_LABELS[selectedProfile.legalStatus] || selectedProfile.legalStatus;

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
          <div className="rulesSource">Status danych: <strong>{statusLabel}</strong></div>
          <p className="rulesSummary">
            Ten system ma w aplikacji tylko podstawowy skrot zasad. Pelne zasady znajdziesz w oficjalnych materialach.
          </p>

          <section className="rulesCards" aria-label="Basic rules sections">
            {SECTION_DEFS.map((section) => (
              <article className="rulesCard is-open" key={section.key}>
                <div className="rulesCardHeader">
                  <span className="rulesCardTitle">{section.label}</span>
                </div>
                <div className="rulesCardBody">
                  <p className="rulesSummary">{selectedProfile.sections?.[section.key] || "Brak lokalnego opisu tej sekcji."}</p>
                </div>
              </article>
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

          <div className="rulesSource">{selectedProfile.legalNote}</div>
        </div>
      </div>
    </div>
  );
}
