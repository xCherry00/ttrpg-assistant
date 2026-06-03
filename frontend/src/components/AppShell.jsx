import Sidebar from "./Sidebar";
import AccountMenu from "./AccountMenu";
import NotificationBell from "./NotificationBell";
import { Link, Outlet, useLocation } from "react-router-dom";

const PAGE_META = [
  { match: (path) => path === "/dashboard", title: "Dashboard", description: "Panel główny aplikacji TTRPG Assistant." },
  { match: (path) => path.startsWith("/campaigns"), title: "Kampanie", description: "Zarządzanie kampaniami i światami gry." },
  { match: (path) => path.startsWith("/characters"), title: "Postacie", description: "Zarządzanie kartami postaci i danymi bohaterów." },
  { match: (path) => path === "/initiative", title: "Tracker inicjatywy", description: "Zarządzanie walką, turami i uczestnikami." },
  { match: (path) => path.includes("/sessions/"), title: "Sesje", description: "Planowanie i prowadzenie sesji RPG." },
  { match: (path) => path.startsWith("/generators"), title: "Generatory", description: "Narzędzia do tworzenia treści RPG." },
  { match: (path) => path === "/settings", title: "Ustawienia", description: "Zarządzaj kontem, bezpieczeństwem i wyglądem aplikacji." },
  { match: (path) => path === "/glossary", title: "Słownik", description: "Pojęcia i terminy ze świata TTRPG. Wybierz hasło z listy po lewej." },
  { match: (path) => path === "/rules", title: "Zasady", description: "Podstawowe zasady do rozpoczęcia gry i legalne materiały startowe." },
  { match: (path) => path === "/dice", title: "Kości", description: "Rzuty kośćmi dla wielu systemów i stylów gry." },
  { match: (path) => path === "/profile", title: "Profil użytkownika", description: "Zarządzaj kontem, aktywnością i swoimi narzędziami." },
  { match: (path) => path === "/friends", title: "Znajomi", description: "Przeglądaj znajomych, zaproszenia i kontakty." },
  { match: (path) => path === "/messages", title: "Wiadomości", description: "Rozmowy i komunikacja z graczami." },
  { match: (path) => path === "/compendium", title: "Kompendium", description: "Baza materiałów i notatek do sesji." },
];

function resolvePageMeta(pathname) {
  return PAGE_META.find((item) => item.match(pathname)) || null;
}

export default function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const pageMeta = resolvePageMeta(location.pathname);
  const isCampaignDetails = /^\/campaigns\/[^/]+$/.test(location.pathname);
  const isLiveSession = /^\/campaigns\/[^/]+\/sessions\/[^/]+\/live$/.test(location.pathname);

  return (
    <div className={`appLayout${isDashboard ? " appLayout--dashboard" : ""}`}>
      <div className="appBody">
        <Sidebar />

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
                    <>
                      <h1 className="appPageHeader__title">{pageMeta.title}</h1>
                      <p className="appPageHeader__subtitle">{pageMeta.description}</p>
                    </>
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
