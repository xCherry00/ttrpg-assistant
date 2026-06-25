import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import AppIcon from "./common/AppIcon";
import NotificationBell from "./NotificationBell";
import Sidebar from "./Sidebar";

const PAGE_META = [
  { match: (path) => path === "/dashboard", title: "Dashboard", description: "Panel główny aplikacji TTRPG Assistant.", icon: "dashboard" },
  { match: (path) => path.startsWith("/campaigns"), title: "Kampanie", description: "Zarządzanie kampaniami i światami gry.", icon: "campaign" },
  { match: (path) => path.startsWith("/characters"), title: "Postacie", description: "Zarządzanie kartami postaci i danymi bohaterów.", icon: "characters" },
  { match: (path) => path === "/notes", title: "Notatki", description: "Proste zapiski z sesji, kampanii, postaci i pomysłów.", icon: "notes" },
  { match: (path) => path === "/initiative", title: "Tracker inicjatywy", description: "Zarządzanie walką, turami i uczestnikami.", icon: "initiative" },
  { match: (path) => path.includes("/sessions/"), title: "Sesje", description: "Planowanie i prowadzenie sesji RPG.", icon: "sessions" },
  { match: (path) => path.startsWith("/generators"), title: "Generatory", description: "Narzędzia do tworzenia treści RPG.", icon: "generators" },
  { match: (path) => path === "/settings", title: "Ustawienia", description: "Zarządzaj kontem, bezpieczeństwem i wyglądem aplikacji.", icon: "settings" },
  { match: (path) => path === "/glossary", title: "Słownik", description: "Pojęcia i terminy ze świata TTRPG. Wybierz hasło z listy po lewej.", icon: "glossary" },
  { match: (path) => path === "/rules", title: "Zasady", description: "Podstawowe zasady do rozpoczęcia gry i legalne materiały startowe.", icon: "rules" },
  { match: (path) => path === "/dice", title: "Kości", description: "Rzuty kośćmi dla wielu systemów i stylów gry.", icon: "dice" },
  { match: (path) => path === "/profile", title: "Profil użytkownika", description: "Zarządzaj kontem, aktywnością i swoimi narzędziami.", icon: "profile" },
  { match: (path) => path === "/friends", title: "Znajomi", description: "Przeglądaj znajomych, zaproszenia i kontakty.", icon: "friends" },
  { match: (path) => path === "/messages", title: "Wiadomości", description: "Rozmowy i komunikacja z graczami.", icon: "messages" },
  { match: (path) => path === "/compendium", title: "Kompendium", description: "Baza materiałów i notatek do sesji.", icon: "compendium" },
];

function resolvePageMeta(pathname) {
  return PAGE_META.find((item) => item.match(pathname)) || null;
}

export default function AppShell() {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isDashboard = location.pathname === "/dashboard";
  const pageMeta = resolvePageMeta(location.pathname);
  const isCampaignDetails = /^\/campaigns\/[^/]+$/.test(location.pathname);
  const isLiveSession = /^\/campaigns\/[^/]+\/sessions\/[^/]+\/live$/.test(location.pathname);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      window.dispatchEvent(new CustomEvent("ttrpg-shell-panel-open", { detail: { source: "sidebar" } }));
    }
  }, [mobileSidebarOpen]);

  return (
    <div className={`appLayout${isDashboard ? " appLayout--dashboard" : ""}${mobileSidebarOpen ? " is-sidebar-open" : ""}`}>
      <div className="appBody">
        <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
        <button
          type="button"
          className="appMobileMenuButton"
          aria-label={mobileSidebarOpen ? "Zamknij menu nawigacji" : "Otwórz menu nawigacji"}
          aria-expanded={mobileSidebarOpen}
          onClick={() => setMobileSidebarOpen((open) => !open)}
        >
          <span aria-hidden="true">☰</span>
          <span>Menu</span>
        </button>
        {mobileSidebarOpen ? (
          <button
            type="button"
            className="appMobileSidebarScrim"
            aria-label="Zamknij menu nawigacji"
            onClick={() => setMobileSidebarOpen(false)}
          />
        ) : null}

        <main className="appMain">
          <div className="appContent">
            <div className="appShellTools" aria-label="Narzędzia konta">
              <NotificationBell />
              <AccountMenu />
            </div>
            <div className="appBackdrop" aria-hidden="true" />
            <div className="appContentInner">
              {pageMeta ? (
                <header className="appPageHeader" aria-label="Nagłówek strony">
                  {isLiveSession ? (
                    <div id="live-session-header-slot" className="appPageHeaderLiveSlot" />
                  ) : isCampaignDetails ? (
                    <Link className="appPageHeaderBack" to="/campaigns">← Powrót do kampanii</Link>
                  ) : (
                    <div className="appPageHeader__main">
                      <span className="appPageHeader__icon" aria-hidden="true">
                        <AppIcon name={pageMeta.icon} />
                      </span>
                      <span className="appPageHeader__copy">
                        <h1 className="appPageHeader__title">{pageMeta.title}</h1>
                        <p className="appPageHeader__subtitle">{pageMeta.description}</p>
                      </span>
                    </div>
                  )}
                </header>
              ) : null}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
