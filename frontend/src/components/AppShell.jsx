import Sidebar from "./Sidebar";
import AccountMenu from "./AccountMenu";
import MessageLauncher from "./MessageLauncher";
import NotificationBell from "./NotificationBell";
import { Outlet, useLocation } from "react-router-dom";

const TOPBAR_CONTEXT = [
  { match: (p) => p === "/dashboard", title: "Dashboard", subtitle: "Status Twojej aktywnosci i sesji." },
  { match: (p) => p.startsWith("/generators"), title: "Generatory losowego kontentu", subtitle: "Szybkie narzedzia do tworzenia tresci sesyjnych." },
  { match: (p) => p.startsWith("/characters"), title: "Postacie", subtitle: "Zarzadzanie kartami postaci i danymi bohaterow." },
  { match: (p) => p.startsWith("/campaigns"), title: "Kampanie", subtitle: "Prowadzenie i organizacja kampanii." },
  { match: (p) => p.startsWith("/initiative"), title: "Inicjatywa", subtitle: "Szybki tracker kolejnosci walki." },
  { match: (p) => p.startsWith("/dice"), title: "Kosci", subtitle: "Rzuty kosci i historia wynikow." },
  { match: (p) => p.startsWith("/friends"), title: "Znajomi", subtitle: "Relacje i kontakty spolecznosci." },
  { match: (p) => p.startsWith("/messages"), title: "Wiadomosci", subtitle: "Rozmowy i wymiana wiadomosci." },
  { match: (p) => p.startsWith("/settings"), title: "Ustawienia", subtitle: "Konfiguracja konta i aplikacji." },
];

export default function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const topBar = TOPBAR_CONTEXT.find((item) => item.match(location.pathname)) || {
    title: "TTRPG Assistant",
    subtitle: "Globalna nawigacja aplikacji.",
  };

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
            <header className="appTopBar" aria-label="Globalny naglowek strony">
              <h1 className="appTopBar__title">{topBar.title}</h1>
              <p className="appTopBar__subtitle">{topBar.subtitle}</p>
            </header>
            <div className="appBackdrop" aria-hidden="true" />
            <div className="appContentInner">
              <Outlet />
            </div>
            <MessageLauncher />
          </div>
        </main>
      </div>
    </div>
  );
}
