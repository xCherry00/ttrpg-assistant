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

function formatSessionStatus(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "IN_PROGRESS") return "Trwa";
  if (normalized === "PLANNED") return "Zaplanowana";
  if (normalized === "FINISHED") return "Zakończona";
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
  return "Brak szczegółów";
}

function pickSessionImage(session) {
  return session?.imageUrl || session?.coverImageUrl || session?.sceneImageUrl || "";
}

function buildDonutGradient(items) {
  const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.value || 0)), 0);
  if (total <= 0) return "conic-gradient(rgba(255,255,255,0.08) 0turn 1turn)";

  let cursor = 0;
  const segments = items
    .filter((item) => Number(item.value) > 0)
    .map((item) => {
      const start = cursor;
      cursor += Number(item.value) / total;
      return `${item.color} ${start}turn ${cursor}turn`;
    });
  return `conic-gradient(${segments.join(", ")})`;
}

function DonutChart({ items, centerValue, centerLabel, ariaLabel }) {
  return (
    <div className="dashboardDonutBlock">
      <div
        className="dashboardDonut"
        role="img"
        aria-label={ariaLabel}
        style={{ "--dashboard-donut": buildDonutGradient(items) }}
      >
        <span>{centerValue}</span>
        <small>{centerLabel}</small>
      </div>
      <div className="dashboardDonutLegend">
        {items.map((item) => (
          <div key={item.label} className="dashboardDonutLegend__item">
            <span className="dashboardDonutLegend__swatch" style={{ background: item.color }} aria-hidden="true" />
            <span>{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
            {expanded ? "Zwiń" : "Rozwiń"}
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
  const [systemsTab, setSystemsTab] = useState("campaigns");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        await getMe(token);
        if (cancelled) return;

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
        setError(err?.message || "Nie udało się odświeżyć danych dashboardu.");
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
        setAttendanceError(err?.message || "Brak danych o dostępności dla najbliższej sesji.");
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

    let status = "W trakcie głosowania";
    if (available === 0 && unavailable === 0 && maybe === 0) {
      status = "Brak odpowiedzi";
    } else if (available >= minimumForSession && minimumForSession > 0) {
      status = "Sesja może się odbyć";
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

  const heroTitle = hero.mode === "active" ? "Aktywna sesja" : hero.mode === "planned" ? "Najbliższa sesja" : "Brak aktywnej lub zaplanowanej sesji";
  const heroSession = hero.session;
  const heroImage = pickSessionImage(heroSession) || heroSession?.campaignCoverImageUrl || "";
  const attendanceChartItems = attendanceSummary ? [
    { label: "Dostępni", value: attendanceSummary.available, color: "#1f765f" },
    { label: "Może", value: attendanceSummary.maybe, color: "#b88734" },
    { label: "Niedostępni", value: attendanceSummary.unavailable, color: "#c85c4a" },
    { label: "Bez odpowiedzi", value: attendanceSummary.noResponse, color: "#64748b" },
  ] : [];
  const roleChartItems = [
    { label: "Jako MG", value: roleStats.asOwner, color: "#1f765f" },
    { label: "Jako gracz", value: roleStats.asMember, color: "#536fae" },
  ];
  const systemChartPalette = ["#536fae", "#1f765f", "#b88734", "#c85c4a", "#64c3b3", "#718078"];
  const activeSystemRows = systemsTab === "campaigns" ? campaignSystems : characterSystems;
  const activeSystemTotal = systemsTab === "campaigns" ? campaigns.length : characters.length;
  const activeSystemChartItems = activeSystemRows.map((item, index) => ({
    label: item.system,
    value: item.count,
    color: systemChartPalette[index % systemChartPalette.length],
  }));
  const activeSystemLabel = systemsTab === "campaigns" ? "kampanii" : "postaci";

  return (
    <div className="page dashboardSaas">
      <section className="dashboardFeatureGrid">
        <article className="dashboardHero">
          <div className="dashboardHero__copy">
            <span>{heroTitle.toUpperCase()}</span>
            {heroSession ? (
              <>
                <h2>{heroSession.title || "Sesja"}</h2>
                <div className="dashboardHero__actions">
                  {hero.mode === "active" ? (
                    <Link className="dashboardHero__primary" to={`/campaigns/${heroSession.campaignId}/sessions/${heroSession.id}/live`}>
                      <DashboardIcon name="play" />
                      Dołącz do sesji
                    </Link>
                  ) : (
                    <Link className="dashboardHero__primary" to={`/campaigns/${heroSession.campaignId}`}>
                      <DashboardIcon name="calendar" />
                      Otwórz sesję
                    </Link>
                  )}
                  <Link className="dashboardHero__secondary" to={`/campaigns/${heroSession.campaignId}`}>
                    <DashboardIcon name="users" />
                    Otwórz kampanię
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
                    Przejdź do kampanii
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
                  <span className="dashboardTag">Otwórz</span>
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
                    <strong>{character.name || "Postać"}</strong>
                    <small>{(character.systemCode || "-").toUpperCase()}</small>
                    <small>{fallbackCharacterSubtitle(character)}</small>
                    <small>{character.campaignTitle || "Brak kampanii"}</small>
                  </span>
                  <span className="dashboardTag">Otwórz</span>
                </Link>
              ))}
            </div>
          </ExpandableTile>

          <ExpandableTile
            title="Nadchodzące sesje"
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
                  <span className="dashboardTag">Otwórz</span>
                </Link>
              ))}
            </div>
          </ExpandableTile>

          <ExpandableTile
            title="Ostatnie sesje"
            count={finishedSessions.length}
            description="Sesje zakończone"
            expanded={expandedTiles.recent}
            onToggle={() => toggleTile("recent")}
            to="/campaigns"
          >
            <div className="dashboardMaterialList">
              {finishedSessions.length === 0 ? (
                <div className="dashboardMaterialItem"><span><strong>Brak zakończonych sesji.</strong></span></div>
              ) : finishedSessions.slice(0, TILE_PREVIEW_LIMIT).map((session) => (
                <Link key={session.id} to={`/campaigns/${session.campaignId}`} className="dashboardMaterialItem">
                  <span>
                    <strong>{session.title || "Sesja"}</strong>
                    <small>{session.campaignTitle || "Kampania"}</small>
                    <small>{formatDateTime(session.finishedAt || session.scheduledFor)} • {formatSessionStatus(session.status)}</small>
                  </span>
                  <span className="dashboardTag">Otwórz</span>
                </Link>
              ))}
            </div>
          </ExpandableTile>
        </div>

        <div>
          <article className="dashboardPanel">
            <header className="dashboardPanel__head">
              <h2>Dostępność graczy</h2>
            </header>
            {attendanceLoading ? <div className="dashboardMaterialItem"><span><strong>Ładowanie dostępności...</strong></span></div> : null}
            {!attendanceLoading && attendanceError ? <div className="dashboardMaterialItem"><span><strong>Brak danych o dostępności dla najbliższej sesji.</strong></span></div> : null}
            {!attendanceLoading && !attendanceError && !attendanceSummary ? <div className="dashboardMaterialItem"><span><strong>Brak danych o dostępności dla najbliższej sesji.</strong></span></div> : null}
            {!attendanceLoading && !attendanceError && attendanceSummary ? (
              <div className="dashboardChartPanel">
                <DonutChart
                  items={attendanceChartItems}
                  centerValue={`${attendanceSummary.availabilityPct}%`}
                  centerLabel="dostępnych"
                  ariaLabel="Wykres dostępności graczy"
                />
                <div className="dashboardChartMeta">
                  <strong>{plannedSessions[0]?.title || "Najbliższa sesja"}</strong>
                  <small>{formatDateTime(plannedSessions[0]?.scheduledFor)}</small>
                  <small>Status: {attendanceSummary.status}</small>
                  <Link to={`/campaigns/${plannedSessions[0]?.campaignId || ""}`}>Zobacz odpowiedzi</Link>
                </div>
              </div>
            ) : null}
          </article>

          <article className="dashboardPanel">
            <header className="dashboardPanel__head">
              <h2>Systemy RPG</h2>
            </header>
            <div className="dashboardTabs" role="tablist" aria-label="Systemy RPG">
              <button
                type="button"
                role="tab"
                aria-selected={systemsTab === "campaigns"}
                className={systemsTab === "campaigns" ? "is-active" : ""}
                onClick={() => setSystemsTab("campaigns")}
              >
                Kampanie
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={systemsTab === "characters"}
                className={systemsTab === "characters" ? "is-active" : ""}
                onClick={() => setSystemsTab("characters")}
              >
                Postacie
              </button>
            </div>
            {activeSystemRows.length === 0 ? (
              <div className="dashboardMaterialItem"><span><small>Brak danych systemów.</small></span></div>
            ) : (
              <div className="dashboardChartPanel dashboardChartPanel--stacked">
                <DonutChart
                  items={activeSystemChartItems}
                  centerValue={activeSystemTotal}
                  centerLabel={activeSystemLabel}
                  ariaLabel={`Wykres systemów RPG dla ${activeSystemLabel}`}
                />
              </div>
            )}
          </article>

          <article className="dashboardPanel">
            <header className="dashboardPanel__head">
              <h2>Twoja rola</h2>
            </header>
            <div className="dashboardChartPanel">
              <DonutChart
                items={roleChartItems}
                centerValue={roleStats.total}
                centerLabel="łącznie"
                ariaLabel="Wykres roli w kampaniach"
              />
              <div className="dashboardChartMeta">
                <strong>Łącznie: {roleStats.total}</strong>
              </div>
            </div>
          </article>

        </div>
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
