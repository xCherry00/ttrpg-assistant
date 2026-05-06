import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { logout as logoutApi } from "../api/auth";
import { getMyProfile } from "../api/settings";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INITIATIVE_CACHE_KEY = "ttrpg_initiative_rows_v1";

const QUICK_ITEMS = [
  { to: "/campaigns", label: "Kampanie" },
  { to: "/dice", label: "Kości" },
];

const PANEL_MG_ITEMS = [
  { to: "/generators", label: "Generatory", icon: "wand" },
  { to: "/initiative", label: "Inicjatywa", icon: "swords" },
];

const PANEL_PLAYER_ITEMS = [
  { to: "/characters", label: "Postacie", icon: "shield" },
  { to: "/glossary", label: "Słowniczek", icon: "book" },
  { to: "/rules", label: "Zasady", icon: "scroll" },
];

function toRoleLabel(user) {
  const role = (user?.role || "PLAYER").toUpperCase();
  const roleLabel = role === "PLAYER" ? "GRACZ" : role;
  return user?.isMg ? `${roleLabel} + MG` : roleLabel;
}

function getAvatarStorageKey(email) {
  return `ttrpg_avatar_${email || "default"}`;
}

function IconBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function PanelMiniIcon({ type }) {
  if (type === "wand") {
    return (
      <IconBase>
        <path d="m4 20 8-8" />
        <path d="m14 10 6-6" />
        <path d="m15 3 1 3" />
        <path d="m20 8-3-1" />
      </IconBase>
    );
  }

  if (type === "swords") {
    return (
      <IconBase>
        <path d="m6 18 4-4" />
        <path d="m14 10 4-4" />
        <path d="m4 14 6-6 6 6" />
      </IconBase>
    );
  }

  if (type === "book") {
    return (
      <IconBase>
        <path d="M4 19a3 3 0 0 1 3-3h13" />
        <path d="M7 16V5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 1-2-2Z" />
      </IconBase>
    );
  }

  if (type === "shield") {
    return (
      <IconBase>
        <path d="M12 3 5 6v5c0 5 3.4 8.5 7 10 3.6-1.5 7-5 7-10V6l-7-3Z" />
        <path d="M12 8v8" />
        <path d="M9 12h6" />
      </IconBase>
    );
  }

  return (
    <IconBase>
      <path d="M8 4h8a3 3 0 0 1 0 6H8a3 3 0 1 0 0 6h8" />
      <path d="M10 8h6" />
      <path d="M10 14h6" />
    </IconBase>
  );
}

export default function TopNav() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [user, setUser] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");
  const menuRef = useRef(null);
  const panelRef = useRef(null);

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    setUserError("");
    try {
      const me = await getMyProfile(token);
      setUser(me);
      setAvatarSrc(localStorage.getItem(getAvatarStorageKey(me?.email)) || "");
    } catch (err) {
      setUserError("Nie udało się pobrać danych konta.");
      setUser(null);
      setAvatarSrc("");
    } finally {
      setLoadingUser(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (cancelled) return;
      await loadUser();
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
      if (!panelRef.current?.contains(event.target)) {
        setOpenPanel(null);
      }
    }

    function onProfileUpdated() {
      loadUser();
    }

    function onStorage(event) {
      if (event.key && event.key.startsWith("ttrpg_avatar_")) {
        loadUser();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("ttrpg-profile-updated", onProfileUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("ttrpg-profile-updated", onProfileUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadUser]);

  const displayName = useMemo(() => {
    if (user?.displayName?.trim()) return user.displayName.trim();
    if (user?.email) return user.email.split("@")[0];
    return "Użytkownik";
  }, [user]);

  const avatarLabel = useMemo(() => {
    const base = displayName || "U";
    return base.slice(0, 1).toUpperCase();
  }, [displayName]);

  function handleLogout() {
    sessionStorage.removeItem(INITIATIVE_CACHE_KEY);
    logoutApi();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topNav">
      <div className="topNav__left">
        <button type="button" className="topNav__brand" onClick={() => navigate("/dashboard")}>
          <span className="topNav__logo" aria-hidden="true">
            <span className="topNav__logoCore" />
          </span>
          <span className="topNav__brandCopy">
            <span className="topNav__brandKicker">Session Toolkit</span>
            <span className="topNav__brandText">TTRPG Assistant</span>
          </span>
        </button>
      </div>

      <nav className="topNav__center">
        {QUICK_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => "topNav__link" + (isActive ? " is-active" : "")}
            onClick={() => setOpenPanel(null)}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="topNav__panelGroup" ref={panelRef}>
          <div className={"topNav__panel topNav__panel--flyout" + (openPanel === "mg" ? " is-open" : "")}>
            <button
              type="button"
              className={"topNav__link topNav__panelButton" + (openPanel === "mg" ? " is-active" : "")}
              aria-expanded={openPanel === "mg"}
              onClick={() => setOpenPanel((prev) => (prev === "mg" ? null : "mg"))}
            >
              Panel Mistrza Gry
            </button>
            <div className="topNav__panelDropdown">
              {PANEL_MG_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => "topNav__panelDropdownLink" + (isActive ? " is-active" : "")}
                  onClick={() => setOpenPanel(null)}
                >
                  <span className="topNav__panelDropdownIcon">
                    <PanelMiniIcon type={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className={"topNav__panel topNav__panel--flyout" + (openPanel === "player" ? " is-open" : "")}>
            <button
              type="button"
              className={"topNav__link topNav__panelButton" + (openPanel === "player" ? " is-active" : "")}
              aria-expanded={openPanel === "player"}
              onClick={() => setOpenPanel((prev) => (prev === "player" ? null : "player"))}
            >
              Panel Gracza
            </button>
            <div className="topNav__panelDropdown">
              {PANEL_PLAYER_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => "topNav__panelDropdownLink" + (isActive ? " is-active" : "")}
                  onClick={() => setOpenPanel(null)}
                >
                  <span className="topNav__panelDropdownIcon">
                    <PanelMiniIcon type={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div className="topNav__right" ref={menuRef}>
        <button
          type="button"
          className="topNav__avatarBtn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="topNav__avatarMeta">
            <span className="topNav__avatarName">{displayName}</span>
            <span className="topNav__avatarRole">{toRoleLabel(user)}</span>
          </span>
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar użytkownika" className="topNav__avatarImg" />
          ) : (
            <span className="topNav__avatar">{avatarLabel}</span>
          )}
        </button>

        {menuOpen && (
          <div className="topNav__menu" role="menu">
            <div className="topNav__menuHeader">
              <div className="topNav__menuName">{displayName}</div>
              <div className="topNav__menuEmail">{user?.email || "Brak emaila"}</div>
              <div className="topNav__menuRole">{toRoleLabel(user)}</div>
            </div>

            <button type="button" className="topNav__menuItem" onClick={() => navigate("/profile")}>
              Profil
            </button>
            <button type="button" className="topNav__menuItem" onClick={() => navigate("/friends")}>
              Znajomi
            </button>
            <button type="button" className="topNav__menuItem" onClick={() => navigate("/settings")}>
              Ustawienia
            </button>
            <button type="button" className="topNav__menuItem is-danger" onClick={handleLogout}>
              Wyloguj
            </button>

            {(loadingUser || userError) && (
              <div className="topNav__menuStatus">
                {loadingUser ? "Ładowanie danych..." : userError}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
