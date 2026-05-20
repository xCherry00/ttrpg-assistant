import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMe } from "../api/me";
import { listCampaignMaterials, listCampaignSessions, listCampaigns } from "../api/campaigns";
import { listCharacters } from "../api/characters";
import "../styles/dashboard.css";

const RECENT_GENERATIONS_KEY = "ttrpg_recent_generations_v1";

const QUICK_ACTIONS = [
  {
    title: "Przygotuj sesję",
    description: "Utwórz scenariusz, notatki i plan sesji",
    to: "/campaigns",
    icon: "book-plus",
    tone: "purple",
  },
  {
    title: "Dodaj postać",
    description: "Stwórz nową postać do kampanii",
    to: "/characters",
    icon: "user-plus",
    tone: "green",
  },
  {
    title: "Rzuć kośćmi",
    description: "Szybki rzut kośćmi online",
    to: "/dice",
    icon: "dice",
    tone: "orange",
  },
  {
    title: "Dodaj notatkę",
    description: "Przejdz do notatek kampanii",
    to: "/campaigns",
    icon: "file-plus",
    tone: "blue",
  },
];

const FALLBACK_MATERIALS = [
  { id: "material-1", type: "NOTE", title: "Notatki do sesji - Rozdział 2", updatedAt: "2026-04-30T08:00:00" },
  { id: "material-2", type: "MAP", title: "Mapa - Północne Krainy", updatedAt: "2026-04-30T04:00:00" },
  { id: "material-3", type: "NPC", title: "NPC - Strażnik Boru", updatedAt: "2026-04-29T16:00:00" },
  { id: "material-4", type: "ITEM", title: "Przedmioty magiczne", updatedAt: "2026-04-28T18:00:00" },
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

function pickNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getDateParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "---", time: "Brak terminu" };
  return {
    day: date.toLocaleDateString("pl-PL", { day: "2-digit" }),
    month: date.toLocaleDateString("pl-PL", { month: "short" }).replace(".", "").toUpperCase(),
    time: date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" }) + ", " + date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
  };
}

function getRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Zaktualizowano niedawno";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `Zaktualizowano ${minutes} min temu`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Zaktualizowano ${hours} godz. temu`;

  const days = Math.round(hours / 24);
  return `Zaktualizowano ${days} ${days === 1 ? "dzień" : "dni"} temu`;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const meResponse = await getMe(token);
        if (cancelled) return;

        setMe(meResponse);
        const resolvedUserId = meResponse?.id ?? meResponse?.userId ?? meResponse?.sub ?? "";
        setRecent(readRecentGenerations(resolvedUserId));

        const [campaignResult, characterResult] = await Promise.allSettled([
          listCampaigns(token),
          listCharacters(token),
        ]);

        if (cancelled) return;

        if (campaignResult.status === "rejected" && campaignResult.reason?.status === 401) {
          throw campaignResult.reason;
        }
        if (characterResult.status === "rejected" && characterResult.reason?.status === 401) {
          throw characterResult.reason;
        }

        const campaignRows = normalizeArray(campaignResult.status === "fulfilled" ? campaignResult.value : []);
        const characterRows = normalizeArray(characterResult.status === "fulfilled" ? characterResult.value : []);

        setCampaigns(campaignRows);
        setCharacters(characterRows);

        if (campaignRows.length > 0) {
          const sessionResults = await Promise.allSettled(
            campaignRows.map((campaign) => listCampaignSessions(token, campaign.id))
          );
          const materialResults = await Promise.allSettled(
            campaignRows.slice(0, 6).map((campaign) => listCampaignMaterials(token, campaign.id))
          );

          if (cancelled) return;

          const sessionRows = sessionResults.flatMap((result, index) => {
            if (result.status !== "fulfilled") return [];
            const campaign = campaignRows[index];
            return normalizeArray(result.value).map((session) => ({ ...session, campaignTitle: campaign?.title, campaignId: campaign?.id }));
          });
          const materialRows = materialResults.flatMap((result, index) => {
            if (result.status !== "fulfilled") return [];
            const campaign = campaignRows[index];
            return normalizeArray(result.value).map((material) => ({ ...material, campaignTitle: campaign?.title }));
          });

          setSessions(sessionRows);
          setMaterials(materialRows);
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message || "Nie udało się odświeżyć danych dashboardu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, logout, navigate]);

  const displayName = useMemo(() => {
    if (me?.displayName?.trim()) return me.displayName.trim();
    if (me?.email) return me.email.split("@")[0];
    return "Mistrz Gry";
  }, [me]);

  const campaignCount = campaigns.length || pickNumber(me?.campaignCount ?? me?.campaignsCount ?? me?.counters?.campaigns);
  const characterCount = characters.length || pickNumber(me?.characterCount ?? me?.charactersCount ?? me?.counters?.characters);
  const materialCount = materials.length || recent.length || pickNumber(me?.materialCount ?? me?.materialsCount ?? me?.counters?.materials);

  const upcomingSessions = useMemo(() => {
    const rows = sessions
      .filter((session) => String(session.status).toUpperCase() === "PLANNED")
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
      .slice(0, 5);
    return rows;
  }, [sessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => String(session.status).toUpperCase() === "IN_PROGRESS") || null,
    [sessions],
  );

  const recentMaterials = useMemo(() => {
    const rows = materials
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 4);
    return rows.length > 0 ? rows : FALLBACK_MATERIALS;
  }, [materials]);

  const kpiCards = [
    { title: "Kampanie", value: campaignCount, subtitle: "Łącznie kampanii", icon: "book", tone: "purple", to: "/campaigns" },
    { title: "Postacie", value: characterCount, subtitle: "Stworzonych postaci", icon: "users", tone: "green", to: "/characters" },
    { title: "Nadchodzące sesje", value: upcomingSessions.length, subtitle: "Sesji zaplanowanych", icon: "calendar", tone: "orange", to: "/campaigns" },
    { title: "Materiały", value: materialCount, subtitle: "Notatek i zasobów", icon: "archive", tone: "blue", to: "/rules" },
  ];

  return (
    <div className="page dashboardSaas">
      <header className="dashboardHeader">
        <div className="dashboardHeader__title">
          <span className="dashboardHeader__icon"><DashboardIcon name="briefcase" /></span>
          <div>
            <h1>Dashboard</h1>
            <p>Witaj ponownie, {displayName}! Gotowy na nową przygodę?</p>
          </div>
        </div>
      </header>

      <section className="dashboardKpis" aria-label="Podsumowanie">
        {kpiCards.map((card) => (
          <Link key={card.title} to={card.to} className={`dashboardKpi dashboardKpi--${card.tone}`}>
            <span className="dashboardKpi__image" aria-hidden="true" />
            <span className="dashboardKpi__icon"><DashboardIcon name={card.icon} /></span>
            <span className="dashboardKpi__content">
              <span>{card.title}</span>
              <strong>{card.value}</strong>
              <small>{card.subtitle}</small>
            </span>
            <span className="dashboardKpi__arrow"><DashboardIcon name="chevron-right" /></span>
          </Link>
        ))}
      </section>

      <section className="dashboardFeatureGrid">
        <article className="dashboardHero">
          <div className="dashboardHero__copy">
            <span>AKTYWNA SESJA</span>
            {activeSession ? (
              <>
                <h2>{activeSession.title}</h2>
                <p>
                  Kampania: {activeSession.campaignTitle || "Kampania"}.
                  Status: {String(activeSession.status).toUpperCase()}.
                </p>
                <div className="dashboardHero__actions">
                  <Link className="dashboardHero__primary" to={`/campaigns/${activeSession.campaignId}/sessions/${activeSession.id}/live`}>
                    <DashboardIcon name="play" />
                    Dołącz do aktywnej sesji
                  </Link>
                  <Link className="dashboardHero__secondary" to={`/campaigns/${activeSession.campaignId}`}>
                    <DashboardIcon name="users" />
                    Otwórz kampanię
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>Brak aktywnej sesji</h2>
                <p>Nie masz teraz sesji IN_PROGRESS. Sprawdź kampanie i nadchodzące terminy.</p>
                <div className="dashboardHero__actions">
                  <Link className="dashboardHero__primary" to="/campaigns">
                    <DashboardIcon name="calendar" />
                    Przejdź do kampanii
                  </Link>
                </div>
              </>
            )}
          </div>
          <div className="dashboardHero__image" aria-hidden="true" />
        </article>

        <aside className="dashboardQuickPanel">
          <header>
            <DashboardIcon name="bolt" />
            <h2>Szybkie akcje</h2>
          </header>
          <div className="dashboardQuickList">
            {QUICK_ACTIONS.map((item) => (
              <Link key={item.title} to={item.to} className="dashboardQuickItem">
                <span className={`dashboardQuickItem__icon dashboardQuickItem__icon--${item.tone}`}>
                  <DashboardIcon name={item.icon} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <DashboardIcon name="chevron-right" />
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="dashboardLowerGrid">
        <article className="dashboardPanel dashboardPanel--sessions">
          <header className="dashboardPanel__head">
            <div>
              <DashboardIcon name="calendar" />
              <h2>Nadchodzące sesje</h2>
            </div>
            <Link to="/campaigns">Zobacz wszystkie</Link>
          </header>

          <div className="dashboardSessionList">
            {upcomingSessions.length === 0 && (
              <div className="dashboardMaterialItem">
                <span className="dashboardMaterialItem__icon"><DashboardIcon name="calendar" /></span>
                <span>
                  <strong>Brak zaplanowanych sesji</strong>
                  <small>Utwórz sesję w kampanii, aby zobaczyć ją tutaj.</small>
                </span>
              </div>
            )}
            {upcomingSessions.map((session) => {
              const date = getDateParts(session.scheduledFor);
              const to = String(session.status).toUpperCase() === "IN_PROGRESS"
                ? `/campaigns/${session.campaignId}/sessions/${session.id}/live`
                : `/campaigns/${session.campaignId || ""}`;
              return (
                <Link key={session.id} to={to} className="dashboardSessionItem">
                  <span className="dashboardDateBadge">
                    <small>{date.month}</small>
                    <strong>{date.day}</strong>
                  </span>
                  <span className="dashboardSessionItem__copy">
                    <strong>{session.title}</strong>
                    <small>{session.campaignTitle ? `${session.campaignTitle} • ${date.time}` : date.time}</small>
                  </span>
                  <span className="dashboardTag">{String(session.status || "PLANNED").toUpperCase()}</span>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="dashboardPanel dashboardPanel--materials">
          <header className="dashboardPanel__head">
            <div>
              <DashboardIcon name="folder" />
              <h2>Ostatnie materiały</h2>
            </div>
            <Link to="/rules">Zobacz wszystkie</Link>
          </header>

          <div className="dashboardMaterialList">
            {recentMaterials.map((material) => (
              <Link key={material.id} to="/rules" className="dashboardMaterialItem">
                <span className="dashboardMaterialItem__icon"><DashboardIcon name={materialIcon(material.type)} /></span>
                <span>
                  <strong>{material.title}</strong>
                  <small>{getRelativeTime(material.updatedAt || material.createdAt)}</small>
                </span>
                <DashboardIcon name="more" />
              </Link>
            ))}
          </div>
        </article>

      </section>

      {(loading || error) && (
        <div className={`dashboardStatusMessage${error ? " is-error" : ""}`}>
          {error || "Odświeżanie danych dashboardu..."}
        </div>
      )}
    </div>
  );
}

function materialIcon(type) {
  const normalized = String(type || "").toUpperCase();
  if (normalized.includes("MAP")) return "map";
  if (normalized.includes("NPC")) return "user";
  if (normalized.includes("ITEM")) return "briefcase";
  return "file";
}

function DashboardIcon({ name }) {
  const icons = {
    archive: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="3" />
        <path d="M8 9h8" />
        <path d="M9 13h6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
    bolt: <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />,
    book: (
      <>
        <path d="M4 19a3 3 0 0 1 3-3h13" />
        <path d="M7 16V5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 1-2-2Z" />
      </>
    ),
    "book-plus": (
      <>
        <path d="M4 19a3 3 0 0 1 3-3h13" />
        <path d="M7 16V5a2 2 0 0 1 2-2h11v16H9a2 2 0 0 1-2-2Z" />
        <path d="M13 7v6" />
        <path d="M10 10h6" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </>
    ),
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    "crossed-swords": (
      <>
        <path d="m14.5 17.5 3 3" />
        <path d="m3 3 7 7" />
        <path d="m21 3-7.5 7.5" />
        <path d="m9.5 14.5-6.5 6.5" />
        <path d="m14 10 4-4" />
        <path d="m10 14-4 4" />
      </>
    ),
    dice: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="9" cy="9" r="1" fill="currentColor" />
        <circle cx="15" cy="9" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="9" cy="15" r="1" fill="currentColor" />
        <circle cx="15" cy="15" r="1" fill="currentColor" />
      </>
    ),
    dragon: (
      <>
        <path d="M4 16c4-8 9-10 16-9-2 2-3 4-3 7" />
        <path d="M7 15c3 4 8 5 12 2" />
        <path d="M13 8 8 4l1 6" />
        <path d="m16 8 4-3-1 5" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    "file-plus": (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M12 12v6" />
        <path d="M9 15h6" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M3 11h18" />
      </>
    ),
    map: (
      <>
        <path d="M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="5" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    sword: (
      <>
        <path d="m14.5 4.5 5 5" />
        <path d="M3 21 15.5 8.5" />
        <path d="m14 4 6 6" />
        <path d="m9 16-3-3" />
      </>
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    "user-plus": (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="3.5" />
        <path d="M20 8v6" />
        <path d="M23 11h-6" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="3.5" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name] || icons.briefcase}
    </svg>
  );
}
