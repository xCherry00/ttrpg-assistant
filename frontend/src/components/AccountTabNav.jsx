import { NavLink } from "react-router-dom";
import "../styles/account-tab-nav.css";

const TABS = [
  { path: "/profile",  label: "Profil" },
  { path: "/friends",  label: "Znajomi" },
  { path: "/settings", label: "Ustawienia" },
];

export default function AccountTabNav() {
  return (
    <nav className="accountTabNav" aria-label="Konto — nawigacja">
      {TABS.map((t) => (
        <NavLink
          key={t.path}
          to={t.path}
          className={({ isActive }) => `accountTab${isActive ? " is-active" : ""}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
