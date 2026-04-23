import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/home.css";

const FEATURES = [
  {
    icon: "🗺️",
    kicker: "Dashboard",
    title: "Centrum dowodzenia sesją",
    desc: "Ostatnie generacje, podgląd kampanii i konto — wszystko na jednym ekranie.",
  },
  {
    icon: "⚗️",
    kicker: "Generatory",
    title: "Materiały gotowe w sekundy",
    desc: "NPC, łupy, osady i więcej — spójne, gotowe do rozbudowy i przypisane do Twojego konta.",
  },
  {
    icon: "🎲",
    kicker: "Prowadzenie gry",
    title: "Narzędzia zawsze pod ręką",
    desc: "Kości, inicjatywa i zasady dostępne z każdego widoku bez opuszczania aplikacji.",
  },
];

export default function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="homePage">
      <main>
        <section className="homeHero">
          <div className="homeHero__inner">
            <div className="homeBadge">Projekt inżynierski · TTRPG Assistant</div>

            <h1 className="homeTitle">
              Jedna baza dowodzenia<br />do sesji TTRPG
            </h1>

            <p className="homeLead">
              Kampanie, generatory, kości, inicjatywa i szybki podgląd działań —
              zebrane w jednym miejscu dla Mistrza Gry i graczy.
            </p>

            <div className="homeCtas">
              {!isLoggedIn ? (
                <>
                  <Link to="/register" className="homeBtnPrimary">Załóż konto</Link>
                  <Link to="/login" className="homeBtnGhost">Zaloguj się</Link>
                </>
              ) : (
                <Link to="/dashboard" className="homeBtnPrimary">Przejdź do dashboardu</Link>
              )}
            </div>

            <div className="homeProof">
              <span>09 aktywnych modułów</span>
              <span className="dot" />
              <span>Generatory NPC i przedmiotów</span>
              <span className="dot" />
              <span>System kampanii z zaproszeniami</span>
            </div>
          </div>
        </section>

        <section className="homeFeatureStrip">
          {FEATURES.map((f) => (
            <article key={f.kicker} className="homeFeatureStrip__item">
              <span className="homeFeatureStrip__icon">{f.icon}</span>
              <span className="homeFeatureStrip__kicker">{f.kicker}</span>
              <h2>{f.title}</h2>
              <p>{f.desc}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="homeFooter">
        © 2025 TTRPG Assistant · projekt inżynierski
      </footer>
    </div>
  );
}
