import Sidebar from "./Sidebar";
import AccountMenu from "./AccountMenu";
import MessageLauncher from "./MessageLauncher";
import NotificationBell from "./NotificationBell";
import { Outlet, useLocation } from "react-router-dom";

const PAGE_META = [
  { match: (path) => path === "/dashboard", title: "Dashboard", description: "Panel glowny aplikacji TTRPG Assistant." },
  { match: (path) => path.startsWith("/campaigns"), title: "Kampanie", description: "Zarzadzanie kampaniami i swiatami gry." },
  { match: (path) => path === "/characters", title: "Postacie", description: "Zarzadzanie kartami postaci i danymi bohaterow." },
  { match: (path) => path === "/initiative" || path.includes("/sessions/"), title: "Sesje", description: "Planowanie i prowadzenie sesji RPG." },
  { match: (path) => path.startsWith("/generators"), title: "Generatory", description: "Narzedzia do tworzenia tresci RPG." },
  { match: (path) => path === "/settings", title: "Ustawienia", description: "Zarzadzaj kontem, bezpieczenstwem i wygladem aplikacji." },
  { match: (path) => path === "/glossary", title: "Slownik", description: "Pojecia i terminy ze swiata TTRPG. Wybierz haslo z listy po lewej." },
  { match: (path) => path === "/rules", title: "Zasady", description: "Podstawowe zasady do rozpoczecia gry i legalne materialy startowe." },
  { match: (path) => path === "/dice", title: "Kosci", description: "Rzuty koscmi dla wielu systemow i stylow gry." },
  { match: (path) => path === "/profile", title: "Profil uzytkownika", description: "Zarzadzaj kontem, aktywnoscia i swoimi narzedziami." },
  { match: (path) => path === "/friends", title: "Znajomi", description: "Przegladaj znajomych, zaproszenia i kontakty." },
  { match: (path) => path === "/messages", title: "Wiadomosci", description: "Rozmowy i komunikacja z graczami." },
  { match: (path) => path === "/compendium", title: "Kompendium", description: "Baza materialow i notatek do sesji." },
];

function resolvePageMeta(pathname) {
  return PAGE_META.find((item) => item.match(pathname)) || null;
}

export default function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const pageMeta = resolvePageMeta(location.pathname);

  return (
    <div className={`appLayout${isDashboard ? " appLayout--dashboard" : ""}`}>
      <div className="appBody">
        <Sidebar />

        <main className="appMain">
          <div className="appContent">
            <div className="appShellTools" aria-label="Narzedzia konta">
              <NotificationBell />
              <AccountMenu />
            </div>
            <div className="appBackdrop" aria-hidden="true" />
            <div className="appContentInner">
              {pageMeta ? (
                <header className="appPageHeader" aria-label="Naglowek strony">
                  <h1 className="appPageHeader__title">{pageMeta.title}</h1>
                  <p className="appPageHeader__subtitle">{pageMeta.description}</p>
                </header>
              ) : null}
              <Outlet />
            </div>
            <MessageLauncher />
          </div>
        </main>
      </div>
    </div>
  );
}
