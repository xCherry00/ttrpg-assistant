import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { logout as logoutApi } from "../api/auth";
import { getMyProfile } from "../api/settings";
import { imagePlaceholder } from "../data/imageLibrary";

const INITIATIVE_CACHE_KEY = "ttrpg_initiative_rows_v1";
const SHELL_PANEL_EVENT = "ttrpg-shell-panel-open";
const PANEL_ID = "account";

function Icon({ name }) {
  const paths = {
    profile: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 0 1-2.97 2.97l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.08 1.64V21.4a2.1 2.1 0 0 1-4.2 0v-.06A1.8 1.8 0 0 0 8.45 19.7a1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 0 1-2.97-2.97l.04-.04a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.64-1.08H2.1a2.1 2.1 0 0 1 0-4.2h.06A1.8 1.8 0 0 0 3.8 8.75a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.1 2.1 0 0 1 2.97-2.97l.04.04a1.8 1.8 0 0 0 1.98.36h.01A1.8 1.8 0 0 0 9.47 2.5V2.1a2.1 2.1 0 0 1 4.2 0v.06a1.8 1.8 0 0 0 1.08 1.64 1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 0 1 2.97 2.97l-.04.04a1.8 1.8 0 0 0-.36 1.98v.01a1.8 1.8 0 0 0 1.64 1.08h.42a2.1 2.1 0 0 1 0 4.2h-.06A1.8 1.8 0 0 0 19.4 15Z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function getRoleBadges(user) {
  const badges = [];
  const role = (user?.role || "PLAYER").toUpperCase();
  if (role === "PLAYER") badges.push("GRACZ");
  if (role && role !== "PLAYER") badges.push(role);
  if (user?.isMg) badges.push("MG");
  return [...new Set(badges)];
}

function getAvatarStorageKey(email) {
  return `ttrpg_avatar_${email || "default"}`;
}

export default function AccountMenu() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState("");
  const [bannerSrc, setBannerSrc] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    setUserError("");
    try {
      const me = await getMyProfile(token);
      setUser(me);
      setAvatarSrc(me?.avatarUrl || localStorage.getItem(getAvatarStorageKey(me?.email)) || "");
      setBannerSrc(me?.profileBannerUrl || imagePlaceholder("campaignBanners"));
    } catch {
      setUser(null);
      setAvatarSrc("");
      setBannerSrc(imagePlaceholder("campaignBanners"));
      setUserError("Nie udalo sie pobrac danych konta.");
    } finally {
      setLoadingUser(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function onShellPanelOpen(event) {
      if (event.detail?.source !== PANEL_ID) {
        setMenuOpen(false);
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
    window.addEventListener(SHELL_PANEL_EVENT, onShellPanelOpen);
    window.addEventListener("ttrpg-profile-updated", onProfileUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener(SHELL_PANEL_EVENT, onShellPanelOpen);
      window.removeEventListener("ttrpg-profile-updated", onProfileUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadUser]);

  const displayName = useMemo(() => {
    if (user?.displayName?.trim()) return user.displayName.trim();
    if (user?.email) return user.email.split("@")[0];
    return "Uzytkownik";
  }, [user]);

  const avatarLabel = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName]);
  const roleBadges = getRoleBadges(user);

  function goTo(path) {
    setMenuOpen(false);
    navigate(path);
  }

  function handleLogout() {
    sessionStorage.removeItem(INITIATIVE_CACHE_KEY);
    logoutApi();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="appAccountMenu topNav__right" ref={menuRef}>
      <button
        type="button"
        className="topNav__avatarBtn"
        onClick={() => {
          const nextOpen = !menuOpen;
          setMenuOpen(nextOpen);
          if (nextOpen) {
            window.dispatchEvent(new CustomEvent(SHELL_PANEL_EVENT, { detail: { source: PANEL_ID } }));
          }
        }}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="Avatar użytkownika" className="topNav__avatarImg" onError={() => setAvatarSrc("")} />
        ) : (
          <span className="topNav__avatar">{avatarLabel}</span>
        )}
        <span className="topNav__avatarMeta">
          <span className="topNav__avatarLabel">Uzytkownik</span>
          <span className="topNav__avatarName">{displayName}</span>
        </span>
        <span className="topNav__avatarChevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {menuOpen && (
        <div className="topNav__menu" role="menu">
          <div className="topNav__menuHeader" style={bannerSrc ? { "--account-banner": `url(${bannerSrc})` } : undefined}>
            {avatarSrc ? (
              <span className="topNav__menuAvatarWrap"><img src={avatarSrc} alt="Avatar użytkownika" className="topNav__menuAvatarImg" onError={() => setAvatarSrc("")} /><i aria-hidden="true" /></span>
            ) : (
              <span className="topNav__menuAvatarWrap"><span className="topNav__menuAvatar">{avatarLabel}</span><i aria-hidden="true" /></span>
            )}
            <div className="topNav__menuIdentity">
              <div className="topNav__menuName">{displayName}</div>
              {user?.email ? <div className="topNav__menuEmail">{user.email}</div> : null}
              <div className="topNav__menuRoleList">
                {roleBadges.map((badge) => (
                  <span key={badge} className="topNav__menuRole">{badge}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="topNav__menuSection">
            <div className="topNav__menuSectionTitle">Konto</div>
            <button type="button" className="topNav__menuItem" onClick={() => goTo("/profile")}> 
              <Icon name="profile" />
              <span>Profil</span>
            </button>
            <button type="button" className="topNav__menuItem" onClick={() => goTo("/settings")}> 
              <Icon name="settings" />
              <span>Ustawienia</span>
            </button>
          </div>

          <div className="topNav__menuSection topNav__menuSection--bottom">
            <button type="button" className="topNav__menuItem is-danger" onClick={handleLogout}>
              <Icon name="logout" />
              <span>Wyloguj</span>
            </button>
          </div>

          {(loadingUser || userError) && (
            <div className="topNav__menuStatus">{loadingUser ? "Ładowanie danych..." : userError}</div>
          )}
        </div>
      )}
    </div>
  );
}
