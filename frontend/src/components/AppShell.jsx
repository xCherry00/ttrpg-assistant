import TopNav from "./TopNav";
import { Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="appLayout">
      <TopNav />

      <main className="appMain">
        <div className="appContent">
          <div className="appBackdrop" aria-hidden="true" />
          <div className="appContentInner">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
