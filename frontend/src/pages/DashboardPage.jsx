import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMe } from "../api/me";
import { getSessionAttendance, listCampaignMembers, listCampaignSessions, listCampaigns } from "../api/campaigns";
import { listCharacters } from "../api/characters";
import "../styles/dashboard.css";

const TILE_PREVIEW_LIMIT = 5;

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStatus(value) {
  return String(value || "").toUpperCase();
}

function toTimestamp(value) {
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak terminu";
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" }) + ", " + date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function pickHeroSession(sessions) {
  const active = sessions.find((session) => normalizeStatus(session.status) === "IN_PROGRESS");
  if (active) return { mode: "active", session: active };

  const planned = sessions
    .filter((session) => normalizeStatus(session.status) === "PLANNED")
    .slice()
    .sort((a, b) => toTimestamp(a.scheduledFor) - toTimestamp(b.scheduledFor));

  if (planned.length > 0) return { mode: "planned", session: planned[0] };

  return { mode: "empty", session: null };
}

function computeCountdownParts(scheduledFor, nowTs) {
  const targetTs = new Date(scheduledFor).getTime();
  if (!Number.isFinite(targetTs) || targetTs <= nowTs) return null;

  const diff = targetTs - nowTs;
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return {
    days,
    hours,
    minutes,
    text: `Pozostalo: ${String(days).padStart(2, "0")} dni ${String(hours).padStart(2, "0")} godz. ${String(minutes).padStart(2, "0")} min.`,
  };
}

function formatSessionStatus(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "IN_PROGRESS") return "Trwa";
  if (normalized === "PLANNED") return "Zaplanowana";
  if (normalized === "FINISHED") return "Zakonczona";
  return normalized || "Nieznany";
}

function countBySystem(rows, fieldName = "systemCode") {
  const counts = new Map();
  rows.forEach((item) => {
    const key = String(item?.[fieldName] || "nieznany").toUpperCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].map(([system, count]) => ({ system, count })).sort((a, b) => b.count - a.count);
}

function countRole(campaigns) {
  let asOwner = 0;
  let asMember = 0;
  campaigns.forEach((campaign) => {
    if (campaign?.owner) asOwner += 1;
    else asMember += 1;
  });
  return { asOwner, asMember, total: campaigns.length };
}

function getCampaignRoleLabel(campaign) {
  return campaign?.owner ? "MG" : "Gracz";
}

function fallbackCharacterSubtitle(character) {
  if (character?.className && character?.raceName) return `${character.raceName} / ${character.className}`;
  if (character?.occupationName) return character.occupationName;
  if (character?.className) return character.className;
  return "Brak szczegolow";
}

function pickSessionImage(session) {
  return session?.imageUrl || session?.coverImageUrl || session?.sceneImageUrl || "";
}

function ExpandableTile({ title, count, description, expanded, onToggle, children, to }) {
  return (
    <article className="dashboardPanel">
      <header className="dashboardPanel__head">
        <div>
          <h2>{title}</h2>
          <small>{description}</small>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="dashboardTag">{count}</span>
          <button type="button" className="campaignDetailsGhostBtn" onClick={onToggle}>
            {expanded ? "Zwin" : "Rozwin"}
          </button>
        </div>
      </header>
      {expanded ? children : null}
      <footer style={{ marginTop: 10 }}>
        <Link to={to}>Zobacz wszystkie</Link>
      </footer>
    </article>
  );
}

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [attendance, setAttendance] = useState(null);
  const [attendanceMembersCount, setAttendanceMembersCount] = useState(0);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  const [expandedTiles, setExpandedTiles] = useState({
    campaigns: true,
    characters: false,
    upcoming: false,
    recent: false,
  });

  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const meResponse = await getMe(token);
        if (cancelled) return;

        setMe(meResponse);

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
          if (cancelled) return;

          const sessionRows = sessionResults.flatMap((result, index) => {
            if (result.status !== "fulfilled") return [];
            const campaign = campaignRows[index];
            return normalizeArray(result.value).map((session) => ({
              ...session,
              campaignTitle: campaign?.title,
              campaignId: campaign?.id,
              campaignSystemCode: campaign?.systemCode,
              campaignOwner: Boolean(campaign?.owner),
              campaignCoverImageUrl: campaign?.coverImageUrl || "",
            }));
          });
          setSessions(sessionRows);
        } else {
          setSessions([]);
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setError(err?.message || "Nie udalo sie odswiezyc danych dashboardu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  // `logout` from context can be non-stable between renders in tests.
  // We intentionally key this loader by auth token and router navigate only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  const hero = useMemo(() => pickHeroSession(sessions), [sessions]);

  const plannedSessions = useMemo(
    () => sessions
      .filter((session) => normalizeStatus(session.status) === "PLANNED")
      .slice()
      .sort((a, b) => toTimestamp(a.scheduledFor) - toTimestamp(b.scheduledFor)),
    [sessions],
  );

  const finishedSessions = useMemo(
    () => sessions
      .filter((session) => normalizeStatus(session.status) === "FINISHED")
      .slice()
      .sort((a, b) => toTimestamp(b.finishedAt || b.scheduledFor) - toTimestamp(a.finishedAt || a.scheduledFor)),
    [sessions],
  );

  const heroCountdown = useMemo(() => {
    if (hero.mode !== "planned" || !hero.session?.scheduledFor) return null;
    return computeCountdownParts(hero.session.scheduledFor, nowTs);
  }, [hero, nowTs]);

  const roleStats = useMemo(() => countRole(campaigns), [campaigns]);
  const campaignSystems = useMemo(() => countBySystem(campaigns, "systemCode"), [campaigns]);
  const characterSystems = useMemo(() => countBySystem(characters, "systemCode"), [characters]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      const nearestPlanned = plannedSessions[0];
      if (!nearestPlanned?.campaignId || !nearestPlanned?.id) {
        setAttendance(null);
        setAttendanceError("");
        setAttendanceMembersCount(0);
        return;
      }

      setAttendanceLoading(true);
      setAttendanceError("");
      try {
        const [attendanceData, members] = await Promise.all([
          getSessionAttendance(token, nearestPlanned.campaignId, nearestPlanned.id),
          listCampaignMembers(token, nearestPlanned.campaignId).catch(() => []),
        ]);
        if (cancelled) return;
        setAttendance(attendanceData);
        setAttendanceMembersCount(Array.isArray(members) ? members.length : 0);
      } catch (err) {
        if (cancelled) return;
        setAttendance(null);
        setAttendanceError(err?.message || "Brak danych o dostepnosci dla najblizszej sesji.");
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    }

    void loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [token, plannedSessions]);

  const attendanceSummary = useMemo(() => {
    if (!attendance) return null;
    const available = Number(attendance.availableCount || 0);
    const unavailable = Number(attendance.unavailableCount || 0);
    const noResponse = Number(attendance.noResponseCount || 0);
    const maybe = Number(attendance.maybeCount || 0);

    const totalMembers = attendanceMembersCount > 0
      ? attendanceMembersCount
      : available + unavailable + noResponse + maybe;

    const minimumForSession = Math.ceil(Math.max(0, totalMembers) / 2);
    const availabilityPct = totalMembers > 0 ? Math.round((available / totalMembers) * 100) : 0;

    let status = "W trakcie glosowania";
    if (available === 0 && unavailable === 0 && maybe === 0) {
      status = "Brak odpowiedzi";
    } else if (available >= minimumForSession && minimumForSession > 0) {
      status = "Sesja moze sie odbyc";
    } else {
      status = "Sesja zagrozona";
    }

    return {
      available,
      unavailable,
      noResponse,
      maybe,
      totalMembers,
      minimumForSession,
      availabilityPct,
      status,
    };
  }, [attendance, attendanceMembersCount]);

  function toggleTile(key) {
    setExpandedTiles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const heroTitle = hero.mode === "active" ? "Aktywna sesja" : hero.mode === "planned" ? "Najblizsza sesja" : "Brak aktywnej lub zaplanowanej sesji";
  const heroSession = hero.session;
  const heroRole = heroSession?.campaignOwner ? "MG" : "Gracz";
  const heroImage = pickSessionImage(heroSession) || heroSession?.campaignCoverImageUrl || "";

  return (
    <div className="page dashboardSaas">
      <section className="dashboardFeatureGrid">
        <article className="dashboardHero">
          <div className="dashboardHero__copy">
            <span>{heroTitle.toUpperCase()}</span>
            {heroSession ? (
              <>
                <h2>{heroSession.title || "Sesja"}</h2>
                <p>Kampania: {heroSession.campaignTitle || "Kampania"}</p>
                <p>Termin: {formatDateTime(heroSession.scheduledFor)}</p>
                <p>Status: {formatSessionStatus(heroSession.status)}</p>
                <p>Twoja rola: {heroRole}</p>
                {hero.mode === "active" ? <p>Sesja trwa</p> : (heroCountdown ? <p>{heroCountdown.text}</p> : null)}
                <div className="dashboardHero__actions">
                  {hero.mode === "active" ? (
                    <Link className="dashboardHero__primary" to={`/campaigns/${heroSession.campaignId}/sessions/${heroSession.id}/live`}>
                      <DashboardIcon name="play" />
                      Dolacz do sesji
                    </Link>
                  ) : (
                    <Link className="dashboardHero__primary" to={`/campaigns/${heroSession.campaignId}`}>
                      <DashboardIcon name="calendar" />
                      Otworz sesje
                    </Link>
                  )}
                  <Link className="dashboardHero__secondary" to={`/campaigns/${heroSession.campaignId}`}>
                    <DashboardIcon name="users" />
                    Otworz kampanie
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>Brak aktywnej lub zaplanowanej sesji</h2>
                <p>Nie masz obecnie zaplanowanej sesji.</p>
                <div className="dashboardHero__actions">
                  <Link className="dashboardHero__secondary" to="/campaigns">
                    <DashboardIcon name="users" />
                    Przejdz do kampanii
                  </Link>
                </div>
              </>
            )}
          </div>
          {heroImage ? (
            <img src={heroImage} alt={heroSession?.title || "Sesja"} className="dashboardHero__image" />
          ) : (
            <div className="dashboardHero__image" aria-hidden="true" />
          )}
        </article>
      </section>

      <section className="dashboardLowerGrid">
        <div>
          <ExpandableTile
            title="Kampanie"
            count={campaigns.length}
            description="Twoje kampanie"
            expanded={expandedTiles.campaigns}
            onToggle={() => toggleTile("campaigns")}
            to="/campaigns"
          >
            <div className="dashboardMaterialList">
              {campaigns.length === 0 ? (
                <div className="dashboardMaterialItem"><span><strong>Brak kampanii</strong></span></div>
              ) : campaigns.slice(0, TILE_PREVIEW_LIMIT).map((campaign) => (
                <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="dashboardMaterialItem">
                  <span>
                    <strong>{campaign.title || "Kampania"}</strong>
                    <small>{getCampaignRoleLabel(campaign)} • {(campaign.systemCode || "-").toUpperCase()}</small>
                  </span>
                  <span className="dashboardTag">Otworz</span>
                </Link>
              ))}
            </div>
          </ExpandableTile>

          <ExpandableTile
            title="Postacie"
            count={characters.length}
            description="Twoje postacie"
            expanded={expandedTiles.characters}
            onToggle={() => toggleTile("characters")}
            to="/characters"
          >
            <div className="dashboardMaterialList">
              {characters.length === 0 ? (
                <div className="dashboardMaterialItem"><span><strong>Brak postaci</strong></span></div>
              ) : characters.slice(0, TILE_PREVIEW_LIMIT).map((character) => (
                <Link key={character.id} to="/characters" className="dashboardMaterialItem">
                  <span>
                    <strong>{character.name || "Postac"}</strong>
                    <small>{(character.systemCode || "-").toUpperCase()}</small>
                    <small>{fallbackCharacterSubtitle(character)}</small>
                    <small>{character.campaignTitle || "Brak kampanii"}</small>
                  </span>
                  <span className="dashboardTag">Otworz</span>
                </Link>
              ))}
            </div>
          </ExpandableTile>

          <ExpandableTile
            title="Nadchodzace sesje"
            count={plannedSessions.length}
            description="Sesje zaplanowane"
            expanded={expandedTiles.upcoming}
            onToggle={() => toggleTile("upcoming")}
            to="/campaigns"
          >
            <div className="dashboardMaterialList">
              {plannedSessions.length === 0 ? (
                <div className="dashboardMaterialItem"><span><strong>Brak zaplanowanych sesji.</strong></span></div>
              ) : plannedSessions.slice(0, TILE_PREVIEW_LIMIT).map((session) => (
                <Link key={session.id} to={`/campaigns/${session.campaignId}`} className="dashboardMaterialItem">
                  <span>
                    <strong>{session.title || "Sesja"}</strong>
                    <small>{session.campaignTitle || "Kampania"}</small>
                    <small>{formatDateTime(session.scheduledFor)}</small>
                  </span>
                  <span className="dashboardTag">Otworz</span>
                </Link>
              ))}
            </div>
          </ExpandableTile>

          <ExpandableTile
            title="Ostatnie sesje"
            count={finishedSessions.length}
            description="Sesje zakonczone"
            expanded={expandedTiles.recent}
            onToggle={() => toggleTile("recent")}
            to="/campaigns"
          >
            <div className="dashboardMaterialList">
              {finishedSessions.length === 0 ? (
                <div className="dashboardMaterialItem"><span><strong>Brak zakonczonych sesji.</strong></span></div>
              ) : finishedSessions.slice(0, TILE_PREVIEW_LIMIT).map((session) => (
                <Link key={session.id} to={`/campaigns/${session.campaignId}`} className="dashboardMaterialItem">
                  <span>
                    <strong>{session.title || "Sesja"}</strong>
                    <small>{session.campaignTitle || "Kampania"}</small>
                    <small>{formatDateTime(session.finishedAt || session.scheduledFor)} • {formatSessionStatus(session.status)}</small>
                  </span>
                  <span className="dashboardTag">Otworz</span>
                </Link>
              ))}
            </div>
          </ExpandableTile>
        </div>

        <div>
          <article className="dashboardPanel">
            <header className="dashboardPanel__head">
              <h2>Dostepnosc graczy</h2>
            </header>
            {attendanceLoading ? <div className="dashboardMaterialItem"><span><strong>Ladowanie dostepnosci...</strong></span></div> : null}
            {!attendanceLoading && attendanceError ? <div className="dashboardMaterialItem"><span><strong>Brak danych o dostepnosci dla najblizszej sesji.</strong></span></div> : null}
            {!attendanceLoading && !attendanceError && !attendanceSummary ? <div className="dashboardMaterialItem"><span><strong>Brak danych o dostepnosci dla najblizszej sesji.</strong></span></div> : null}
            {!attendanceLoading && !attendanceError && attendanceSummary ? (
              <div className="dashboardMaterialList">
                <div className="dashboardMaterialItem">
                  <span>
                    <strong>{plannedSessions[0]?.title || "Najblizsza sesja"}</strong>
                    <small>{formatDateTime(plannedSessions[0]?.scheduledFor)}</small>
                    <small>Dostepni: {attendanceSummary.available}</small>
                    <small>Niedostepni: {attendanceSummary.unavailable}</small>
                    <small>Bez odpowiedzi: {attendanceSummary.noResponse}</small>
                    <small>Procent dostepnych: {attendanceSummary.availabilityPct}%</small>
                    <small>Status: {attendanceSummary.status}</small>
                  </span>
                </div>
                <Link to={`/campaigns/${plannedSessions[0]?.campaignId || ""}`} className="dashboardMaterialItem">
                  <span><strong>Zobacz odpowiedzi</strong></span>
                </Link>
              </div>
            ) : null}
          </article>

          <article className="dashboardPanel">
            <header className="dashboardPanel__head">
              <h2>Systemy RPG</h2>
            </header>
            <div className="dashboardMaterialList">
              <div className="dashboardMaterialItem"><span><strong>Kampanie</strong></span></div>
              {campaignSystems.length === 0 ? (
                <div className="dashboardMaterialItem"><span><small>Brak danych systemow.</small></span></div>
              ) : campaignSystems.map((item) => (
                <div key={`campaign-${item.system}`} className="dashboardMaterialItem">
                  <span style={{ width: "100%" }}>
                    <small>{item.system}</small>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(6, Math.round((item.count / campaigns.length) * 100))}%`, height: "100%", background: "#6aa9ff" }} />
                    </div>
                    <small>{item.count}</small>
                  </span>
                </div>
              ))}

              <div className="dashboardMaterialItem"><span><strong>Postacie</strong></span></div>
              {characterSystems.length === 0 ? (
                <div className="dashboardMaterialItem"><span><small>Brak danych systemow.</small></span></div>
              ) : characterSystems.map((item) => (
                <div key={`character-${item.system}`} className="dashboardMaterialItem">
                  <span style={{ width: "100%" }}>
                    <small>{item.system}</small>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(6, Math.round((item.count / characters.length) * 100))}%`, height: "100%", background: "#72d39b" }} />
                    </div>
                    <small>{item.count}</small>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboardPanel">
            <header className="dashboardPanel__head">
              <h2>Twoja rola</h2>
            </header>
            <div className="dashboardMaterialList">
              <div className="dashboardMaterialItem"><span><strong>Jako MG: {roleStats.asOwner}</strong></span></div>
              <div className="dashboardMaterialItem"><span><strong>Jako gracz: {roleStats.asMember}</strong></span></div>
              <div className="dashboardMaterialItem"><span><strong>Lacznie: {roleStats.total}</strong></span></div>
            </div>
          </article>

        </div>
      </section>

      {(loading || error) && (
        <div className={`dashboardStatusMessage${error ? " is-error" : ""}`}>
          {error || "Odswiezanie danych dashboardu..."}
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
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
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
