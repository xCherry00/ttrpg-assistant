import PublicTopbar from "../components/PublicTopbar";

const SOURCES = [
  {
    name: "Dungeons & Dragons SRD 5.1 / 5.2",
    owner: "Wizards of the Coast LLC",
    license: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    url: "https://www.dndbeyond.com/srd",
    scope:
      "Bazowe dane D&D 5E/SRD: reguły referencyjne, potwory, czary, przedmioty, stany i mechaniki udostępnione w SRD.",
  },
  {
    name: "5e-bits / D&D 5e API",
    owner: "5e-bits community",
    license: "Projekt open-source; dane pochodzą z SRD i są udostępniane przez publiczne API.",
    url: "https://www.dnd5eapi.co/",
    scope:
      "Techniczne źródło API dla kompendium: listy i szczegóły encji takich jak monsters, spells, equipment, magic-items, conditions i skills.",
  },
];

const ATTRIBUTIONS = [
  "This work includes material taken from the System Reference Document 5.1 and/or 5.2, provided by Wizards of the Coast and available under the Creative Commons Attribution 4.0 International License.",
  "Dungeons & Dragons and D&D are trademarks of Wizards of the Coast. TTRPG Assistant is an independent academic project and is not affiliated with, endorsed, sponsored, or approved by Wizards of the Coast.",
  "API data is requested from the public D&D 5e API / 5e-bits project. The application keeps source attribution visible so generated and displayed compendium data can be traced back to its legal source.",
];

const LEGAL_PAGE_OVERRIDES = `
.legalPage {
  min-height: 100vh !important;
  height: 100vh !important;
  overflow: auto !important;
  color: #1d2722 !important;
  background:
    linear-gradient(90deg, rgba(22, 33, 29, 0.035) 1px, transparent 1px),
    linear-gradient(180deg, rgba(22, 33, 29, 0.035) 1px, transparent 1px),
    #f4faf7 !important;
  background-size: 32px 32px, 32px 32px, auto !important;
  padding: 18px 24px 56px !important;
}
.legalSectionLabel {
  color: #1f765f !important;
}
.legalHero h1,
.legalPanel h2,
.legalSourceCard h2 {
  color: #1d2722 !important;
}
.legalHero p,
.legalPanel p,
.legalAttributionList li {
  color: #4e6058 !important;
}
.legalPanel,
.legalSourceCard {
  border: 1px solid rgba(31, 118, 95, 0.16) !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.86) !important;
  box-shadow: 0 16px 44px rgba(31, 39, 34, 0.1) !important;
  backdrop-filter: none !important;
}
.legalPanel--intro {
  border-color: rgba(31, 118, 95, 0.28) !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 248, 243, 0.92)) !important;
}
.legalSourceCard dt {
  color: #65766e !important;
}
.legalSourceCard dd {
  color: #25332d !important;
}
.legalSourceCard a {
  color: #155844 !important;
  font-weight: 800 !important;
}
.legalAttributionList li {
  border: 1px solid rgba(31, 118, 95, 0.12) !important;
  border-radius: 10px !important;
  background: rgba(247, 250, 247, 0.9) !important;
}
`;

export default function LegalPage() {
  return (
    <div className="legalPage">
      <style>{LEGAL_PAGE_OVERRIDES}</style>
      <div className="legalPublicNav">
        <PublicTopbar />
      </div>
      <header className="legalHero">
        <h1>Licencje i źródła danych</h1>
        <p>
          Ta strona opisuje, z jakich legalnych źródeł korzysta moduł kompendium
          i jak oznaczane są materiały referencyjne dla D&D 5E.
        </p>
      </header>

      <main className="legalMain">
        <section className="legalPanel legalPanel--intro">
          <div>
            <span className="legalSectionLabel">Zakres projektu</span>
            <h2>Projekt akademicki bez komercyjnego użycia</h2>
          </div>
          <p>
            TTRPG Assistant jest przygotowywany jako praca inżynierska. Aplikacja
            nie sprzedaje treści źródłowych, nie zastępuje podręczników i pokazuje
            wyłącznie dane, które mogą być użyte na podstawie publicznych licencji
            lub otwartych źródeł SRD.
          </p>
        </section>

        <section className="legalGrid" aria-label="Źródła danych">
          {SOURCES.map((source) => (
            <article key={source.name} className="legalSourceCard">
              <div>
                <span className="legalSectionLabel">{source.owner}</span>
                <h2>{source.name}</h2>
              </div>
              <dl>
                <div>
                  <dt>Licencja</dt>
                  <dd>{source.license}</dd>
                </div>
                <div>
                  <dt>Użycie w aplikacji</dt>
                  <dd>{source.scope}</dd>
                </div>
                <div>
                  <dt>Źródło</dt>
                  <dd>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.url}
                    </a>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <section className="legalPanel">
          <div>
            <span className="legalSectionLabel">Atrybucja</span>
            <h2>Informacje wymagane przy danych D&D SRD</h2>
          </div>
          <ul className="legalAttributionList">
            {ATTRIBUTIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

      </main>
    </div>
  );
}
