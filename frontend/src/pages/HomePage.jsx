import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { IMAGE_LIBRARY } from "../data/imageLibrary";
import "../styles/home.css";

const previewBanner =
  IMAGE_LIBRARY.campaignBanners.find((banner) => banner.id === "campaign-banner-dn3")?.src ||
  IMAGE_LIBRARY.campaignBanners[0]?.src;

const previewIcon =
  IMAGE_LIBRARY.campaignIcons.find((icon) => icon.id === "campaign-icon-d2")?.src ||
  IMAGE_LIBRARY.campaignIcons[0]?.src;

const MODULES = [
  { label: "Kampanie", value: "Planowanie sesji" },
  { label: "Postacie", value: "Karty bohaterów" },
  { label: "Kości", value: "Standard i Genesys" },
  { label: "Notatki", value: "Sesje, NPC, tropy" },
];

function BrandMark() {
  return (
    <span className="homeLogoMark" aria-hidden="true">
      <span />
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg className="homeArrowIcon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h11" />
      <path d="m11 5 5 5-5 5" />
    </svg>
  );
}

function Navbar({ primaryTarget, primaryLabel, isLoggedIn }) {
  return (
    <header className="homeNavbar" aria-label="Główna nawigacja">
      <Link to="/" className="homeBrand" aria-label="TTRPG Assistant - strona główna">
        <BrandMark />
        <span>
          <strong>TTRPG</strong> Assistant
        </span>
      </Link>

      <nav className="homeNavbarActions" aria-label="Akcje konta">
        <Link to="/legal" className="homeTextLink">
          Licencje i źródła
        </Link>
        {!isLoggedIn && (
          <Link to="/login" className="homeTextLink">
            Zaloguj się
          </Link>
        )}
        <Link to={primaryTarget} className="homeButton homeButton--small">
          {primaryLabel}
        </Link>
      </nav>
    </header>
  );
}

function WorkspacePreview() {
  return (
    <section className="homeWorkspacePreview" aria-label="Podgląd przestrzeni pracy">
      <img className="homePreviewBanner" src={previewBanner} alt="" aria-hidden="true" />
      <div className="homePreviewContent">
        <div className="homePreviewHeader">
          <img src={previewIcon} alt="" aria-hidden="true" />
          <div>
            <p>Aktywna kampania</p>
            <strong>Vivat dla Smoków</strong>
          </div>
          <span>Live</span>
        </div>

        <div className="homePreviewSession">
          <p>Najbliższa sesja</p>
          <strong>Spotkanie drużyny</strong>
          <span>15.06 · 16:10 · około 4 godz.</span>
        </div>

        <div className="homeModuleGrid">
          {MODULES.map((module) => (
            <article key={module.label} className="homeModuleCard">
              <strong>{module.label}</strong>
              <span>{module.value}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const primaryTarget = isLoggedIn ? "/dashboard" : "/register";
  const primaryLabel = isLoggedIn ? "Przejdź do aplikacji" : "Utwórz konto";

  return (
    <div className="homePage">
      <div className="homeShell">
        <Navbar primaryTarget={primaryTarget} primaryLabel={primaryLabel} isLoggedIn={isLoggedIn} />

        <main className="homeOneScreen">
          <section className="homeHeroCopy" aria-labelledby="homeHeroTitle">
            <h1 id="homeHeroTitle">TTRPG Assistant</h1>
            <p className="homeLead">
              Jedno miejsce na kampanie, postacie, notatki, kości, inicjatywę i szybkie przygotowanie
              sesji.
            </p>
            <p className="homeDescription">
              Aplikacja porządkuje najważniejsze elementy rozgrywki, żeby podczas prowadzenia sesji
              mniej czasu tracić na szukanie informacji, a więcej zostawić na decyzje drużyny.
            </p>

            <div className="homeActions">
              <Link to={primaryTarget} className="homeButton homeButton--hero">
                {primaryLabel}
                <ArrowIcon />
              </Link>
              {!isLoggedIn && (
                <Link to="/login" className="homeGhostButton">
                  Zaloguj się
                </Link>
              )}
              <Link to="/legal" className="homeGhostButton">
                Licencje i źródła
              </Link>
            </div>

            <p className="homeLegalNote">
              Sekcje zasad i kompendium korzystają z legalnych źródeł SRD oraz publicznych danych API.
              Szczegóły znajdują się na stronie licencji i źródeł danych.
            </p>
          </section>

          <WorkspacePreview />
        </main>
      </div>
    </div>
  );
}
