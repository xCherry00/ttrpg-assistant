import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { logout as logoutApi } from "../api/auth";
import { useEffect, useState } from "react";

const INITIATIVE_CACHE_KEY = "ttrpg_initiative_rows_v1";

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }

    return () => document.body.classList.remove("sidebar-open");
  }, [open]);

  const handleLogout = () => {
    sessionStorage.removeItem(INITIATIVE_CACHE_KEY);
    logoutApi();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={"sidebar" + (open ? " is-open" : "")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="sidebar__inner">
        <div className="sidebar__brand">
          <div className="sidebar__logo" />
          <div className="sidebar__brandText">TTRPG Assistant</div>
        </div>

        <nav className="sidebar__nav">
          <SideItem to="/dashboard" icon={<DashboardIcon />} label="Dashboard" />
          <SideItem to="/glossary" icon={<BookIcon />} label="Słowniczek" />
          <SideItem to="/dice" icon={<DiceIcon />} label="Kości" />
          <SideItem to="/initiative" icon={<SwordsIcon />} label="Inicjatywa" />
          <SideItem to="/campaigns" icon={<MapIcon />} label="Kampanie" />
          <SideItem to="/generators" icon={<WandIcon />} label="Generatory" />
          <SideItem to="/rules" icon={<ScrollIcon />} label="Zasady" />
        </nav>

        <div className="sidebar__bottom">
          <SideItem to="/settings" icon={<SettingsIcon />} label="Ustawienia" />
          <button
            className="sidebar__logout"
            type="button"
            onClick={handleLogout}
            title="Wyloguj się"
          >
            <span className="sidebar__logoutText">Wyloguj</span>
            <span className="sidebar__logoutIcon" aria-hidden="true">
              <LogoutIcon />
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function SideItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "sidebar__item" + (isActive ? " is-active" : "")
      }
    >
      <div className="sidebar__icon">{icon}</div>
      <div className="sidebar__label">{label}</div>
    </NavLink>
  );
}

function IconBase({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <IconBase>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </IconBase>
  );
}

function BookIcon() {
  return (
    <IconBase>
      <path d="M4 19a3 3 0 0 1 3-3h13" />
      <path d="M7 16V5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 1-2-2Z" />
      <path d="M7 6H4v13a2 2 0 0 0 2 2h14" />
    </IconBase>
  );
}

function DiceIcon() {
  return (
    <IconBase>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
    </IconBase>
  );
}

function SwordsIcon() {
  return (
    <IconBase>
      <path d="m6 18 4-4" />
      <path d="m14 10 4-4" />
      <path d="m8 20 2-2" />
      <path d="m14 4 2 2" />
      <path d="m4 14 6-6 6 6" />
      <path d="m10 8 4-4" />
    </IconBase>
  );
}

function ScrollIcon() {
  return (
    <IconBase>
      <path d="M8 4h8a3 3 0 0 1 0 6H8a3 3 0 1 0 0 6h8" />
      <path d="M8 16a3 3 0 1 1 0-6" />
      <path d="M10 8h6" />
      <path d="M10 14h6" />
    </IconBase>
  );
}

function WandIcon() {
  return (
    <IconBase>
      <path d="m4 20 8-8" />
      <path d="m14 10 6-6" />
      <path d="m15 3 1 3" />
      <path d="m20 8-3-1" />
      <path d="m18 2-1 3" />
      <path d="m21 5-3 1" />
    </IconBase>
  );
}

function MapIcon() {
  return (
    <IconBase>
      <path d="M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </IconBase>
  );
}

function SettingsIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </IconBase>
  );
}

function LogoutIcon() {
  return (
    <IconBase>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}
