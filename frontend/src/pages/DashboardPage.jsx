import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMe } from "../api/me";
import { getSessionNoteBacklog, listCampaignSessions, listCampaigns } from "../api/campaigns";
import { listCharacters } from "../api/characters";
import "../styles/dashboard.css";

const RECENT_GENERATIONS_KEY = "ttrpg.generatorHistory";

function readRecentGenerations() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_GENERATIONS_KEY);
    const parsed = JSON.parse(raw || "[]");
    const list = Array.isArray(parsed) ? parsed : [];
    return list
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        id: entry.id || `${entry.generatorCode || "generator"}-${entry.createdAt || Math.random().toString(36).slice(2, 8)}`,
        type: entry.generatorCode || "generator",
        title: entry.result?.title || entry.label || "Wygenerowana treść",
        preview: entry.result?.summary || entry.result?.description || entry.result?.hook || "",
        createdAt: entry.createdAt || null,
        sourceGenerator: entry.label || entry.generatorCode || "Generator",
        generatorCode: entry.generatorCode || null,
      }))
      .slice(0, 20);
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
  const [recent, setRecent] = useState([]);
  const [sessionNoteBacklog, setSessionNoteBacklog] = useState([]);
  const [sessionNoteBacklogError, setSessionNoteBacklogError] = useState("");
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
        setRecent(readRecentGenerations());

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

        try {
          const backlogRows = await getSessionNoteBacklog(token);
          if (!cancelled) {
            setSessionNoteBacklog(Array.isArray(backlogRows) ? backlogRows.slice(0, 5) : []);
            setSessionNoteBacklogError("");
          }
        } catch (backlogErr) {
          if (!cancelled) {
            setSessionNoteBacklog([]);
            setSessionNoteBacklogError(backlogErr?.message || "Nie udalo sie pobrac zaleglych notatek.");
          }
        }

        if (campaignRows.length > 0) {
          const sessionResults = await Promise.allSettled(
            campaignRows.map((campaign) => listCampaignSessions(token, campaign.id))
          );
          if (cancelled) return;

          const sessionRows = sessionResults.flatMap((result, index) => {
            if (result.status !== "fulfilled") return [];
            const campaign = campaignRows[index];
            return normalizeArray(result.value).map((session) => ({ ...session, campaignTitle: campaign?.title, campaignId: campaign?.id }));
          });
          setSessions(sessionRows);
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
  const finishedSessionsCount = useMemo(
    () => sessions.filter((session) => String(session.status).toUpperCase() === "FINISHED").length,
    [sessions],
  );

  const upcomingSessions = useMemo(() => {
    const rows = sessions
      .filter((session) => String(session.status).toUpperCase() === "PLANNED")
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
      .slice(0, 3);
    return rows;
  }, [sessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => String(session.status).toUpperCase() === "IN_PROGRESS") || null,
    [sessions],
  );

  const recentGenerated = useMemo(
    () => recent.slice().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5),
    [recent],
  );

  const kpiCards = [
    { title: "Kampanie", value: campaignCount, subtitle: "Łącznie kampanii", icon: "book", tone: "purple", to: "/campaigns" },
    { title: "Postacie", value: characterCount, subtitle: "Stworzonych postaci", icon: "users", tone: "green", to: "/characters" },
    { title: "Nadchodzące sesje", value: upcomingSessions.length, subtitle: "Sesji zaplanowanych", icon: "calendar", tone: "orange", to: "/campaigns" },
    { title: "Sesje", value: finishedSessionsCount, subtitle: "Zakończone sesje z Twoich kampanii", icon: "archive", tone: "blue", to: "/campaigns" },
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
                    Dołącz do sesji
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
                <p>Nie prowadzisz teraz żadnej sesji na żywo.</p>
              </>
            )}
          </div>
          <div className="dashboardHero__image" aria-hidden="true" />
        </article>
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
                  <strong>Brak zaplanowanych sesji.</strong>
                </span>
              </div>
            )}
            {upcomingSessions.map((session) => {
              const date = getDateParts(session.scheduledFor);
              const to = `/campaigns/${session.campaignId || ""}`;
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

        <article className="dashboardPanel">
          <header className="dashboardPanel__head">
            <div>
              <DashboardIcon name="file" />
              <h2>Zaległe notatki</h2>
            </div>
          </header>
          <div className="dashboardMaterialList">
            {sessionNoteBacklogError ? (
              <div className="dashboardMaterialItem">
                <span>
                  <strong>Nie udalo sie pobrac zaleglych notatek.</strong>
                  <small>Sprobuj odswiezyc dashboard za chwile.</small>
                </span>
              </div>
            ) : null}
            {!sessionNoteBacklogError && sessionNoteBacklog.length === 0 ? (
              <div className="dashboardMaterialItem">
                <span>
                  <strong>Brak zaległych notatek</strong>
                  <small>Wszystkie zakończone sesje mają Twoje notatki.</small>
                </span>
              </div>
            ) : null}
            {!sessionNoteBacklogError && sessionNoteBacklog.map((item) => (
              <Link key={`${item.campaignId}-${item.sessionId}`} to={`/campaigns/${item.campaignId}`} className="dashboardMaterialItem">
                <span className="dashboardMaterialItem__icon"><DashboardIcon name="file" /></span>
                <span>
                  <strong>{item.sessionTitle || "Sesja"}</strong>
                  <small>{item.campaignTitle || "Kampania"}</small>
                  <small>{item.finishedAt ? getDateParts(item.finishedAt).time : "Brak daty zakończenia"}</small>
                </span>
                <span className="dashboardTag">Dodaj notatkę</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="dashboardPanel dashboardPanel--materials">
          <header className="dashboardPanel__head">
            <div>
              <DashboardIcon name="folder" />
              <h2>Ostatnio wygenerowane</h2>
            </div>
            <Link to="/generators">Otwórz generator</Link>
          </header>

          <div className="dashboardMaterialList">
            {recentGenerated.length === 0 && (
              <div className="dashboardMaterialItem">
                <span>
                  <strong>Brak ostatnio wygenerowanych treści</strong>
                  <small>Użyj generatora, aby zobaczyć tutaj historię.</small>
                </span>
              </div>
            )}
            {recentGenerated.map((item) => (
              <Link key={item.id} to={item.generatorCode ? `/generators/${encodeURIComponent(item.generatorCode)}` : "/generators"} className="dashboardMaterialItem">
                <span className="dashboardMaterialItem__icon"><DashboardIcon name="spark" /></span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.sourceGenerator} • {getRelativeTime(item.createdAt)}</small>
                  {item.preview ? <small>{item.preview}</small> : null}
                </span>
                <DashboardIcon name="chevron-right" />
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
    spark: (
      <>
        <path d="M12 2 9.6 8.2 3 10.8l6.6 2.6L12 20l2.4-6.6 6.6-2.6-6.6-2.6Z" />
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
