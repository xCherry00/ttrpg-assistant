import { Outlet } from "react-router-dom";

export default function PublicShell() {
  return (
    <div className="publicShell">
      <div className="publicContainer">
        <Outlet />
      </div>
    </div>
  );
}
