import Sidebar from "./Sidebar";
import AccountMenu from "./AccountMenu";
import MessageLauncher from "./MessageLauncher";
import NotificationBell from "./NotificationBell";
import { Outlet, useLocation } from "react-router-dom";

export default function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

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
              <Outlet />
            </div>
            <MessageLauncher />
          </div>
        </main>
      </div>
    </div>
  );
}
