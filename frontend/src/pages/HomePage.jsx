import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/home.css";

const HERO_CARDS = [
  {
    icon: "book",
    title: "Kampanie i sesje",
    desc: "Planuj, prowadź i śledź postępy.",
    className: "homeHeroCard--campaigns",
  },
  {
    icon: "dice",
    title: "Generatory i kości",
    desc: "Losuj pomysły i rzuty w sekundę.",
    className: "homeHeroCard--dice",
  },
  {
    icon: "user",
    title: "Postacie i notatki",
    desc: "Miej wszystkie informacje zawsze pod ręką.",
    className: "homeHeroCard--notes",
  },
  {
    icon: "shield",
    title: "Kompendium i inicjatywa",
    desc: "Porządek, szybkość i lepsza kontrola.",
    className: "homeHeroCard--compendium",
  },
];

const FEATURE_CARDS = [
  {
    icon: "calendar",
    title: "Kampanie i sesje",
    desc: "Organizuj kampanie, planuj sesje, śledź postępy i materiały.",
  },
  {
    icon: "user",
    title: "Postacie i notatki",
    desc: "Twórz postacie, zapisuj notatki i ważne informacje.",
  },
  {
    icon: "dice",
    title: "Generatory i kości",
    desc: "Generuj tabele, pomysły i rzuty. Obsługa kości wielościennych.",
  },
  {
    icon: "shield",
    title: "Kompendium i inicjatywa",
    desc: "Zarządzaj wiedzą o świecie i inicjatywą w czasie rzeczywistym.",
  },
];

const STEPS = [
  {
    icon: "userPlus",
    title: "Utwórz konto",
    desc: "Załóż darmowe konto w kilka sekund. Bez karty płatniczej.",
  },
  {
    icon: "folder",
    title: "Dodaj kampanię",
    desc: "Stwórz kampanię, zaproś graczy i przygotuj sesję.",
  },
  {
    icon: "dice",
    title: "Prowadź i graj",
    desc: "Korzystaj z narzędzi, miej porządek i ciesz się płynną rozgrywką.",
  },
];

function Icon({ name, className = "" }) {
  const common = {
    className: `homeIcon ${className}`,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  switch (name) {
    case "book":
      return (
        <svg {...common}>
          <path d="M15 8h18a4 4 0 0 1 4 4v27H17a6 6 0 0 0-6 6V12a4 4 0 0 1 4-4Z" />
          <path d="M11 39a6 6 0 0 1 6-6h20" />
          <path d="M18 15h11" />
        </svg>
      );
    case "dice":
      return (
        <svg {...common}>
          <path d="m24 5 16 9v20l-16 9-16-9V14l16-9Z" />
          <path d="M8 14l16 9 16-9" />
          <path d="M24 23v20" />
          <circle cx="18" cy="17" r="1.7" />
          <circle cx="30" cy="17" r="1.7" />
          <circle cx="24" cy="30" r="1.7" />
          <circle cx="17" cy="34" r="1.7" />
          <circle cx="31" cy="34" r="1.7" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="24" cy="17" r="7" />
          <path d="M10 41c2.2-8.2 7.4-12 14-12s11.8 3.8 14 12" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M24 6 39 12v11c0 9.4-5.9 16.4-15 20-9.1-3.6-15-10.6-15-20V12l15-6Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path d="M13 10h22a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V15a5 5 0 0 1 5-5Z" />
          <path d="M16 6v8M32 6v8M8 20h32" />
        </svg>
      );
    case "userPlus":
      return (
        <svg {...common}>
          <circle cx="21" cy="18" r="7" />
          <path d="M8 41c2-8.1 6.6-12 13-12 4.1 0 7.5 1.6 9.9 5" />
          <path d="M36 24v12M30 30h12" />
        </svg>
      );
    case "folder":
      return (
        <svg {...common}>
          <path d="M7 15a5 5 0 0 1 5-5h9l5 6h10a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V15Z" />
        </svg>
      );
    case "people":
      return (
        <svg className="homeBadgeIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M3.5 19c.5-3.4 2.2-5.2 4.5-5.2s4 1.8 4.5 5.2" />
          <path d="M13 18.5c.4-2.3 1.6-3.5 3.4-3.5 1.7 0 3 1.2 3.4 3.5" />
        </svg>
      );
    default:
      return null;
  }
}

function ArrowIcon() {
  return (
    <svg className="homeArrowIcon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h11" />
      <path d="m11 5 5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="homeCheckIcon" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <path d="m5.8 9.2 2.1 2.1 4.5-4.8" />
    </svg>
  );
}

function Navbar({ primaryTarget, primaryLabel, isLoggedIn }) {
  return (
    <header className="homeNavbar" aria-label="Główna nawigacja">
      <Link to="/" className="homeBrand" aria-label="TTRPG Assistant - strona główna">
        <span className="homeLogoMark" aria-hidden="true" />
        <span><strong>TTRPG</strong> Assistant</span>
      </Link>
      <nav className="homeNavbarActions" aria-label="Akcje konta">
        {!isLoggedIn && <Link to="/login" className="homeLoginLink">Zaloguj się</Link>}
        <Link to={primaryTarget} className="homeButton homeButton--small">
          {primaryLabel}
        </Link>
      </nav>
    </header>
  );
}

function HeroIllustration() {
  return (
    <div className="homeHeroVisual" aria-label="Najważniejsze moduły TTRPG Assistant">
      <div className="homeOrb" aria-hidden="true">
        <span className="homeOrbShape" />
      </div>
      <svg className="homeOrbitLine" viewBox="0 0 520 360" fill="none" aria-hidden="true">
        <path d="M350 51c73 18 112 68 111 121-.8 41-26 59-21 92 4 28 27 42 52 49" />
      </svg>
      <span className="homeSpark homeSpark--one" aria-hidden="true" />
      <span className="homeSpark homeSpark--two" aria-hidden="true" />
      <span className="homeSpark homeSpark--three" aria-hidden="true" />
      <span className="homeSpark homeSpark--four" aria-hidden="true" />
      {HERO_CARDS.map((card) => (
        <article className={`homeHeroCard ${card.className}`} key={card.title}>
          <span className="homeHeroCardIcon"><Icon name={card.icon} /></span>
          <div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function HeroSection({ primaryTarget, primaryLabel }) {
  return (
    <section className="homeHero" aria-labelledby="homeHeroTitle">
      <div className="homeHeroCopy">
        <div className="homeBadge"><Icon name="people" /> Dla Mistrzów Gry i Graczy</div>
        <h1 id="homeHeroTitle">
          Wszystko, czego potrzebujesz do sesji TTRPG <span>w jednym miejscu</span>
        </h1>
        <p>
          Organizuj kampanie, prowadź sesje, zarządzaj postaciami, korzystaj z generatorów,
          kompendium, kości i trackera inicjatywy. Mniej chaosu w notatkach, więcej czasu na grę.
        </p>
        <Link to={primaryTarget} className="homeButton homeButton--hero">
          {primaryLabel}
          <ArrowIcon />
        </Link>
        <ul className="homeBenefits" aria-label="Korzyści">
          <li><CheckIcon /> Bez karty płatniczej</li>
          <li><CheckIcon /> Stworzone dla TTRPG</li>
          <li><CheckIcon /> Dla graczy i Mistrzów Gry</li>
        </ul>
      </div>
      <HeroIllustration />
    </section>
  );
}

function FeatureCards() {
  return (
    <section className="homeSection" aria-labelledby="homeFeaturesTitle">
      <div className="homeSectionHeader">
        <h2 id="homeFeaturesTitle">Wszystkie narzędzia dla Twojej opowieści</h2>
        <p>Moduły zaprojektowane z myślą o płynnej pracy przy stole i poza nim.</p>
      </div>
      <div className="homeFeatureGrid">
        {FEATURE_CARDS.map((feature) => (
          <article className="homeFeatureCard" key={feature.title}>
            <span className="homeFeatureIcon"><Icon name={feature.icon} /></span>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <a href={`#${feature.title.toLowerCase().replaceAll(" ", "-")}`}>
                Dowiedz się więcej <ArrowIcon />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="homeSection homeSection--steps" aria-labelledby="homeStepsTitle">
      <div className="homeSectionHeader">
        <h2 id="homeStepsTitle">Jak to działa?</h2>
        <p>Zacznij w 3 prostych krokach i skup się na tym, co najważniejsze — na grze.</p>
      </div>
      <div className="homeSteps">
        {STEPS.map((step, index) => (
          <article className="homeStepCard" key={step.title}>
            <span className="homeStepNumber">{index + 1}</span>
            <span className="homeStepIcon"><Icon name={step.icon} /></span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CTASection({ primaryTarget, primaryLabel }) {
  return (
    <section className="homeFinalCta" aria-label="Rozpocznij korzystanie z TTRPG Assistant">
      <div className="homeCtaSpark" aria-hidden="true" />
      <h2>Więcej porządku. Mniej przygotowań. Lepsze sesje.</h2>
      <Link to={primaryTarget} className="homeButton homeButton--small">
        {primaryLabel}
        <ArrowIcon />
      </Link>
    </section>
  );
}

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const primaryTarget = isLoggedIn ? "/dashboard" : "/register";
  const primaryLabel = isLoggedIn ? "Przejdź do aplikacji" : "Rozpocznij za darmo";

  return (
    <div className="homePage">
      <div className="homeShell">
        <Navbar primaryTarget={primaryTarget} primaryLabel={primaryLabel} isLoggedIn={isLoggedIn} />
        <main>
          <HeroSection primaryTarget={primaryTarget} primaryLabel={primaryLabel} />
          <FeatureCards />
          <HowItWorks />
          <CTASection primaryTarget={primaryTarget} primaryLabel={primaryLabel} />
        </main>
      </div>
    </div>
  );
}
