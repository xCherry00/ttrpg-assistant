import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/home.css";

const APP_MODULES = [
  "Dashboard",
  "Kampanie",
  "Postacie",
  "Generatory",
  "Kości",
  "Inicjatywa",
  "Kompendium",
  "Wiadomości",
];

const DASHBOARD_AREAS = [
  { title: "Kampanie", action: "Zobacz wszystkie" },
  { title: "Postacie", action: "Zobacz wszystkie" },
  { title: "Sesje", action: "Planowanie" },
  { title: "Wiadomości", action: "Zobacz wszystkie" },
];

const FEATURE_CARDS = [
  {
    title: "Kampanie",
    desc: "Zbieraj sesje, notatki, postacie i materiały w jednym miejscu.",
  },
  {
    title: "Generatory",
    desc: "Twórz NPC, lokacje, przygody, łupy i inne materiały pomocne przy sesji.",
  },
  {
    title: "Kości",
    desc: "Rzucaj kośćmi w różnych trybach, także dla Fate/Fudge i Genesys/Narrative.",
  },
  {
    title: "Inicjatywa",
    desc: "Prowadź walkę, kolejność tur, HP i uczestników starcia.",
  },
  {
    title: "Kompendium",
    desc: "Przeglądaj dane z systemów RPG w czytelnej formie.",
  },
  {
    title: "Wiadomości",
    desc: "Rozmawiaj z graczami i wymieniaj materiały do sesji.",
  },
];

const QUICK_ACCESS = [
  { title: "Generatory", desc: "NPC, lokacje, przygody i łupy" },
  { title: "Kości", desc: "Standard, Fate/Fudge, Genesys" },
  { title: "Inicjatywa", desc: "Kolejność tur, HP i uczestnicy" },
  { title: "Kompendium", desc: "Czytelny podgląd danych RPG" },
];

const AUDIENCE_CARDS = [
  {
    title: "Dla Mistrza Gry",
    items: [
      "Organizacja kampanii",
      "Szybkie tworzenie materiałów",
      "Prowadzenie sesji i walki",
      "Mniejszy chaos w notatkach",
    ],
  },
  {
    title: "Dla graczy",
    items: [
      "Dostęp do postaci",
      "Komunikacja z drużyną",
      "Materiały sesyjne w jednym miejscu",
      "Szybsze przygotowanie do gry",
    ],
  },
];

function ModuleIcon({ label }) {
  return (
    <span className="homeModuleIcon" aria-hidden="true">
      {label.slice(0, 1)}
    </span>
  );
}

function TinyPeopleIcon() {
  return (
    <svg className="homeTinyIcon" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M8 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM3.5 19c.4-3 2.2-5 4.5-5s4.1 2 4.5 5m.5 0c.3-2.2 1.6-3.6 3.4-3.6 1.9 0 3.2 1.4 3.6 3.6" />
    </svg>
  );
}

function AppPreview() {
  return (
    <aside className="homeAppPreview" aria-label="Podgląd aplikacji TTRPG Assistant">
      <div className="homeAppPreview__sidebar">
        <div className="homePreviewBrand">
          <span className="homeLogoMark" aria-hidden="true" />
          <strong>TTRPG Assistant</strong>
        </div>
        <nav aria-label="Moduły aplikacji">
          {APP_MODULES.map((item) => (
            <span key={item} className={item === "Dashboard" ? "is-active" : ""}>
              <ModuleIcon label={item} />
              {item}
            </span>
          ))}
        </nav>
      </div>

      <div className="homeAppPreview__workspace">
        <header className="homePreviewHeader">
          <div>
            <span>Panel główny</span>
            <h2>Dashboard</h2>
          </div>
          <span className="homePreviewAction">+ Nowa kampania</span>
        </header>

        <div className="homePreviewStats" aria-label="Główne obszary dashboardu">
          {DASHBOARD_AREAS.map((item) => (
            <article key={item.title}>
              <small>{item.title}</small>
              <strong>{item.action}</strong>
            </article>
          ))}
        </div>

        <div className="homePreviewGrid">
          <section className="homePreviewPanel homePreviewPanel--wide">
            <div className="homePreviewPanel__head">
              <h3>Najbliższa sesja</h3>
              <span>Workspace kampanii</span>
            </div>
            <div className="homeSessionCard">
              <span className="homeSessionCover" aria-hidden="true" />
              <div>
                <strong>Sesja kampanii</strong>
                <p>Notatki, postacie, materiały i status graczy.</p>
              </div>
            </div>
            <div className="homePreviewRows">
              <span>Kampanie i sesje</span>
              <span>Postacie graczy</span>
              <span>Materiały sesyjne</span>
            </div>
          </section>

          <section className="homePreviewPanel">
            <div className="homePreviewPanel__head">
              <h3>Szybki dostęp</h3>
              <span>Realne moduły</span>
            </div>
            <div className="homeQuickList">
              {QUICK_ACCESS.map((item) => (
                <article key={item.title}>
                  <ModuleIcon label={item.title} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const primaryTarget = isLoggedIn ? "/dashboard" : "/register";
  const primaryLabel = isLoggedIn ? "Przejdź do aplikacji" : "Rozpocznij za darmo";

  return (
    <div className="homePage">
      <header className="homeTopbar">
        <Link to="/" className="homeBrand" aria-label="TTRPG Assistant">
          <span className="homeLogoMark" aria-hidden="true" />
          <span><strong>TTRPG</strong> Assistant</span>
        </Link>
        <div className="homeTopbar__actions">
          {!isLoggedIn && <Link to="/login" className="homeLoginLink">Zaloguj się</Link>}
          <Link to={primaryTarget} className="homeTopCta">{primaryLabel}</Link>
        </div>
      </header>

      <main>
        <section className="homeHero">
          <div className="homeHero__copy">
            <div className="homeBadge"><TinyPeopleIcon /> Dla Mistrzów Gry i Graczy</div>
            <h1>
              Wszystko, czego potrzebujesz do sesji TTRPG <span>w jednym miejscu</span>
            </h1>
            <p>
              Organizuj kampanie, prowadź sesje, zarządzaj postaciami, korzystaj z generatorów,
              kompendium, kości i trackera inicjatywy. Mniej chaosu w notatkach, więcej czasu na grę.
            </p>
            <div className="homeHero__actions">
              <Link to={primaryTarget} className="homeBtnPrimary">{primaryLabel}</Link>
            </div>
            <div className="homeTrustList" aria-label="Najważniejsze informacje">
              <span>Bez karty płatniczej</span>
              <span>Stworzone dla TTRPG</span>
              <span>Dla graczy i Mistrzów Gry</span>
            </div>
          </div>

          <AppPreview />
        </section>

        <section className="homeSection" aria-labelledby="homeFeaturesTitle">
          <div className="homeSection__head">
            <h2 id="homeFeaturesTitle">Wszystkie narzędzia dla lepszych sesji</h2>
            <p>Od przygotowań po ostatni rzut kością - najważniejsze moduły masz w jednym miejscu.</p>
          </div>
          <div className="homeFeatureGrid">
            {FEATURE_CARDS.map((feature) => (
              <article className="homeFeatureCard" key={feature.title}>
                <ModuleIcon label={feature.title} />
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="homeAudienceSection" aria-labelledby="homeAudienceTitle">
          <div className="homeSection__head">
            <h2 id="homeAudienceTitle">Dla graczy i prowadzących</h2>
            <p>Ten sam panel porządkuje przygotowania, komunikację i narzędzia przy stole.</p>
          </div>
          <div className="homeAudienceGrid">
            {AUDIENCE_CARDS.map((card) => (
              <article className="homeAudienceCard" key={card.title}>
                <h3>{card.title}</h3>
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="homeFinalCta">
          <div>
            <h2>Przygotuj następną sesję bez przekopywania się przez kilka narzędzi.</h2>
            <p>TTRPG Assistant łączy najważniejsze elementy prowadzenia i grania w jednym panelu.</p>
          </div>
          <Link to={primaryTarget} className="homeBtnPrimary">{primaryLabel}</Link>
        </section>
      </main>

      <footer className="homeFooter">
        <span>© 2026 TTRPG Assistant</span>
        <Link to="/legal">Licencje i źródła</Link>
      </footer>
    </div>
  );
}
