import { Link } from "react-router-dom";

const SOURCES = [
  {
    name: "Dungeons & Dragons SRD 5.1 / 5.2",
    owner: "Wizards of the Coast LLC",
    license: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    url: "https://www.dndbeyond.com/srd",
    scope: "Bazowe dane D&D 5E/SRD: reguly referencyjne, potwory, czary, przedmioty, stany i mechaniki udostepnione w SRD.",
  },
  {
    name: "5e-bits / D&D 5e API",
    owner: "5e-bits community",
    license: "Projekt open-source; dane pochodza z SRD i sa udostepniane przez publiczne API.",
    url: "https://www.dnd5eapi.co/",
    scope: "Techniczne źródło API dla kompendium: listy i szczegóły encji takich jak monsters, spells, equipment, magic-items, conditions i skills.",
  },
];

const ATTRIBUTIONS = [
  "This work includes material taken from the System Reference Document 5.1 and/or 5.2, provided by Wizards of the Coast and available under the Creative Commons Attribution 4.0 International License.",
  "Dungeons & Dragons and D&D are trademarks of Wizards of the Coast. TTRPG Assistant is an independent academic project and is not affiliated with, endorsed, sponsored, or approved by Wizards of the Coast.",
  "API data is requested from the public D&D 5e API / 5e-bits project. The application keeps source attribution visible so generated and displayed compendium data can be traced back to its legal source.",
];

export default function LegalPage() {
  return (
    <div className="legalPage">
      <header className="legalHero">
        <Link to="/" className="legalBack">← Strona główna</Link>
        <span className="legalEyebrow">TTRPG Assistant</span>
        <h1>Licencje i źródła danych</h1>
        <p>
          Ta strona opisuje, z jakich legalnych źródeł korzysta moduł kompendium
          i jak oznaczane są materiały referencyjne dla D&D 5E.
        </p>
      </header>

      <main className="legalMain">
        <section className="legalPanel">
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

        <section className="legalGrid">
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

        <section className="legalPanel legalPanel--split">
          <div>
            <span className="legalSectionLabel">Czego nie zawieramy</span>
            <h2>Granice bezpieczeństwa licencyjnego</h2>
          </div>
          <div className="legalColumns">
            <p>
              Kompendium nie powinno importować zamkniętych treści z podręczników,
              settingów, przygód, grafik, opisów fabularnych ani nazw własnych,
              które nie są częścią SRD albo osobno udostępnionej licencji.
            </p>
            <p>
              Jeśli w przyszłości pojawi się nowe źródło danych, przed podłączeniem
              powinno zostać dopisane tutaj razem z nazwą licencji, linkiem źródłowym
              i zakresem użycia w aplikacji.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
