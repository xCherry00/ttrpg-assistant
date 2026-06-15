import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { logout as logoutApi } from "../api/auth";
import AppIcon from "./common/AppIcon";

const INITIATIVE_CACHE_KEY = "ttrpg_initiative_rows_v1";
const DASHBOARD_ITEM = { to: "/dashboard", label: "Dashboard", icon: "dashboard" };

const SECTION_GAMEPLAY = [
  { to: "/campaigns", label: "Kampanie", icon: "campaign" },
  { to: "/characters", label: "Postacie", icon: "characters" },
  { to: "/notes", label: "Notatki", icon: "notes" },
];

const SECTION_COMMUNITY = [
  { to: "/friends", label: "Znajomi", icon: "friends" },
  { to: "/messages", label: "Wiadomości", icon: "messages" },
];

const SECTION_TOOLS = [
  { to: "/generators", label: "Generatory", icon: "generators" },
  { to: "/initiative", label: "Inicjatywa", icon: "initiative" },
  { to: "/dice", label: "Kości", icon: "dice" },
];

const SECTION_LIBRARY = [
  { to: "/compendium", label: "Kompendium", icon: "compendium" },
  { to: "/rules", label: "Zasady", icon: "rules" },
  { to: "/glossary", label: "Słownik", icon: "glossary" },
];

export default function Sidebar({ onNavigate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sections = useMemo(() => ([
    { id: "gameplay", title: "Rozgrywka", items: SECTION_GAMEPLAY },
    { id: "community", title: "Społeczność", items: SECTION_COMMUNITY },
    { id: "tools", title: "Narzędzia", items: SECTION_TOOLS },
    { id: "library", title: "Biblioteka", items: SECTION_LIBRARY },
  ]), []);
  const activeSectionId = sections.find((section) => section.items.some((item) => location.pathname.startsWith(item.to)))?.id;
  const [openSectionId, setOpenSectionId] = useState(() => activeSectionId || "gameplay");

  useEffect(() => {
    if (activeSectionId) {
      setOpenSectionId(activeSectionId);
    }
  }, [activeSectionId]);

  const toggleSection = (id) => {
    setOpenSectionId((previous) => (previous === id ? null : id));
  };

  const handleLogout = () => {
    sessionStorage.removeItem(INITIATIVE_CACHE_KEY);
    logoutApi();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__inner">
        <div className="sidebar__brand">
          <div className="sidebar__logo" aria-hidden="true">
            <AppIcon name="logo" className="sidebar__brandLogo" />
          </div>
          <div className="sidebar__brandCopy">
            <strong>TTRPG Assistant</strong>
            <span>GM Operations Workspace</span>
          </div>
        </div>

        <div className="sidebar__sections">
          <nav className="sidebar__nav" aria-label="Główne">
            <SideItem to={DASHBOARD_ITEM.to} icon={DASHBOARD_ITEM.icon} label={DASHBOARD_ITEM.label} onNavigate={onNavigate} />
          </nav>
          {sections.map((section) => (
            <Section
              key={section.id}
              title={section.title}
              items={section.items}
              open={openSectionId === section.id}
              active={section.id === activeSectionId}
              onToggle={() => toggleSection(section.id)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="sidebar__footer">
          <SideItem to="/settings" icon="settings" label="Ustawienia" onNavigate={onNavigate} />
          <button className="sidebar__logout" type="button" onClick={handleLogout}>
            <span>Wyloguj</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function Section({ title, items, open, active, onToggle, onNavigate }) {
  return (
    <section className={`sidebar__section${open ? " is-open" : ""}${active ? " is-active" : ""}`}>
      <button type="button" className="sidebar__sectionToggle" onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <ChevronIcon />
      </button>
      {open && (
        <nav className="sidebar__nav">
          {items.map((item) => (
            <SideItem key={item.to} to={item.to} icon={item.icon} label={item.label} onNavigate={onNavigate} />
          ))}
        </nav>
      )}
    </section>
  );
}

function SideItem({ to, icon, label, onNavigate }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar__item${isActive ? " is-active" : ""}`} onClick={onNavigate}>
      <div className="sidebar__icon">
        <AppIcon name={icon} className={`sidebar__assetIcon sidebar__assetIcon--${icon}`} />
      </div>
      <div className="sidebar__label">{label}</div>
    </NavLink>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
