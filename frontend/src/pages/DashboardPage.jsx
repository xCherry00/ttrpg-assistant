import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMe } from "../api/me";
import "../styles/dashboard.css";

const RECENT_GENERATIONS_KEY = "ttrpg_recent_generations_v1";

const NAV_ITEMS = [
  {
    to: "/generators",
    title: "Generatory",
    description: "NPC, przedmioty, lokacje i więcej.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    to: "/initiative",
    title: "Inicjatywa",
    description: "Kolejność tur i HP uczestników walki.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    to: "/characters",
    title: "Postacie",
    description: "Karty bohaterów i kreator postaci.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    to: "/rules",
    title: "Zasady",
    description: "Szybkie sprawdzanie reguł systemu.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    to: "/glossary",
    title: "Słowniczek",
    description: "Słownik pojęć i terminów TTRPG.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    to: "/dice",
    title: "Kości",
    description: "Rzuty kośćmi bez opuszczania aplikacji.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
        <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>
        <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/>
        <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
];

function readRecentGenerations(userId) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_GENERATIONS_KEY);
    const parsed = JSON.parse(raw || "[]");
    const list = Array.isArray(parsed) ? parsed : [];
    if (!userId) return [];
    return list.filter((entry) => String(entry?.userId || "") === String(userId));
  } catch {
    return [];
  }
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getMe(token);
        if (!cancelled) {
          setMe(res);
          const resolvedUserId = res?.id ?? res?.userId ?? res?.sub ?? "";
          setRecent(readRecentGenerations(resolvedUserId));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load /me");
        if (err?.status === 401) {
          logout();
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, logout, navigate]);

  const meObj = useMemo(() => {
    if (!me) return null;
    if (typeof me === "string") return { raw: me };
    return me;
  }, [me]);

  const email = useMemo(() => meObj?.email ?? meObj?.username ?? "", [meObj]);

  const role = useMemo(() => meObj?.role ?? meObj?.authorities?.[0] ?? "", [meObj]);

  const roleLabel = useMemo(() => {
    const normalized = (role || "PLAYER").toUpperCase();
    const base = normalized === "PLAYER" ? "Gracz" : normalized;
    return meObj?.isMg ? `${base} + MG` : base;
  }, [role, meObj]);

  const displayName = useMemo(() => meObj?.displayName || meObj?.email?.split("@")[0] || "Wędrowcze", [meObj]);

  const recentCount = recent.length;

  const initiativeCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.sessionStorage.getItem("ttrpg_initiative_rows_v1");
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const lastGen = recent[0] || null;
  const todayDate = useMemo(() => new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" }), []);

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboardPage">

      {/* HERO */}
      <section className="dashHero panel">
        <div className="dashHeroCopy">
          <span className="pageEyebrow">{todayDate}</span>
          <h1 className="dashHeroTitle">
            Witaj, <span className="dashHeroName">{displayName}</span>
          </h1>
          <p className="dashHeroSub">
            Twój asystent sesji RPG. Generatory, inicjatywa, postacie i zasady — wszystko pod ręką.
          </p>
          <div className="dashHeroMeta">
            <span className="dashMetaPill">{roleLabel}</span>
            {recentCount > 0 && <span className="dashMetaPill">{recentCount} generacji</span>}
            {initiativeCount > 0 && <span className="dashMetaPill">{initiativeCount} w walce</span>}
          </div>
        </div>
        <div className="dashHeroActions">
          <Link to="/generators" className="btn btn-primary">Otwórz generatory</Link>
          <button className="btn btn-ghost dashLogoutBtn" type="button" onClick={onLogout}>Wyloguj</button>
        </div>
      </section>

      {/* STATS */}
      <section className="dashStatGrid">
        <article className="dashStatCard panel-soft">
          <div className="dashStatIcon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="dashStatBody">
            <span className="dashStatLabel">Generacje</span>
            <strong className="dashStatValue">{recentCount}</strong>
            <p className="dashStatText">Wygenerowane elementy w tym koncie</p>
          </div>
        </article>

        <article className="dashStatCard panel-soft">
          <div className="dashStatIcon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div className="dashStatBody">
            <span className="dashStatLabel">Inicjatywa</span>
            <strong className="dashStatValue">{initiativeCount}</strong>
            <p className="dashStatText">Uczestników w bieżącej walce</p>
          </div>
        </article>

        <article className="dashStatCard panel-soft dashStatCard--account">
          <div className="dashStatBody">
            <span className="dashStatLabel">Konto</span>
            {loading && <span className="dashStatValue dashStatValue--sm">...</span>}
            {!loading && !error && <strong className="dashStatValue dashStatValue--sm">{email || "—"}</strong>}
            {!loading && error && <span className="dashStatValue dashStatValue--sm dashStatError">Błąd</span>}
            <p className="dashStatText">Zalogowany jako {roleLabel}</p>
          </div>
        </article>
      </section>

      {/* QUICK ACTIONS */}
      <section className="dashQuick panel-soft">
        <h2 className="dashSectionTitle">Szybkie akcje</h2>
        <div className="dashQuickGrid">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className="dashQuickAction">
              <div className="dashQuickIcon">{item.icon}</div>
              <div className="dashQuickBody">
                <div className="dashQuickTitle">{item.title}</div>
                <div className="dashQuickDesc">{item.description}</div>
              </div>
              <svg className="dashQuickArrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* LAST GENERATION */}
      {lastGen && (
        <section className="dashLastGen panel-soft">
          <div className="dashLastGenHeader">
            <h2 className="dashSectionTitle" style={{ margin: 0 }}>Ostatnia generacja</h2>
            <span className="dashPreviewTime">{formatTime(lastGen.createdAt)}</span>
          </div>
          <div className="dashLastGenBody">
            {Object.entries(lastGen.payload || {}).slice(0, 4).map(([key, val]) => (
              <div className="dashLastGenRow" key={key}>
                <span className="dashLastGenKey">{key}</span>
                <span className="dashLastGenVal">{String(val)}</span>
              </div>
            ))}
          </div>
          <Link to="/generators" className="dashInlineLink">Otwórz generatory →</Link>
        </section>
      )}

      {error && <div className="dashError">{error}</div>}
    </div>
  );
}
