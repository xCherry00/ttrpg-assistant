import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMe } from "../api/me";
import { getSessionAttendance, listCampaignMembers, listCampaignSessions, listCampaigns } from "../api/campaigns";
import { listCharacters } from "../api/characters";
import { imagePlaceholder } from "../data/imageLibrary";
import "../styles/dashboard.css";

const PREVIEW_LIMIT = 4;
const ACTIVITY_LIMIT = 6;
const WEEK_DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
const ASCII_WEEK_DAYS = ["Pn", "Wt", "Sr", "Cz", "Pt", "Sb", "Nd"];
const LEGACY_WEEK_DAYS = ["Dzis", "Jutro", "Pojutrze", "Czw", "Pt", "Sob", "Nd"];
const WEEK_NOTE_PREFIX = "AVAILABILITY_WEEK_V1:";
const EMPTY_WEEK = Object.fromEntries(WEEK_DAYS.map((day) => [day, "none"]));

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStatus(value) {
  return String(value || "").toUpperCase();
}

function toTimestamp(value) {
  const ts = new Date(value || 0).getTime();
  return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak terminu";
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) + ", " + date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function formatCompactDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "---" };
  return {
    day: date.toLocaleDateString("pl-PL", { day: "2-digit" }),
    month: date.toLocaleDateString("pl-PL", { month: "short" }).replace(".", ""),
  };
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

function pickAvailabilitySession(sessions) {
  const planned = sessions
    .filter((session) => normalizeStatus(session.status) === "PLANNED")
    .slice()
    .sort((a, b) => toTimestamp(a.scheduledFor) - toTimestamp(b.scheduledFor));

  if (planned.length > 0) return planned[0];

  return sessions.find((session) => normalizeStatus(session.status) === "IN_PROGRESS") || null;
}

function normalizeAvailabilityStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "AVAILABLE") return "available";
  if (value === "MAYBE") return "maybe";
  if (value === "UNAVAILABLE") return "unavailable";
  return "none";
}

function parseWeekNote(note, fallbackStatus = "none") {
  const raw = String(note || "");
  if (!raw.startsWith(WEEK_NOTE_PREFIX)) {
    return { ...EMPTY_WEEK, Pn: normalizeAvailabilityStatus(fallbackStatus) };
  }

  try {
    const parsed = JSON.parse(raw.slice(WEEK_NOTE_PREFIX.length));
    const normalized = { ...EMPTY_WEEK };
    WEEK_DAYS.forEach((day, index) => {
      normalized[day] = normalizeAvailabilityStatus(parsed?.[day] || parsed?.[ASCII_WEEK_DAYS[index]] || parsed?.[LEGACY_WEEK_DAYS[index]]);
    });
    return normalized;
  } catch {
    return { ...EMPTY_WEEK };
  }
}

function memberDisplayName(item, index) {
  return item?.displayName || item?.username || item?.name || `Gracz ${index + 1}`;
}

function buildAvailabilityRows(members, attendance) {
  const responses = normalizeArray(attendance?.responses);
  if (responses.length > 0) {
    return responses.map((response, index) => ({
      id: response.userId || response.id || index,
      name: memberDisplayName(response, index),
      week: parseWeekNote(response.note, response.status),
    }));
  }

  return normalizeArray(members).map((member, index) => ({
    id: member.userId || member.id || index,
    name: memberDisplayName(member, index),
    week: { ...EMPTY_WEEK },
  }));
}

function availabilityStatusLabel(status) {
  if (status === "available") return "Dostepny";
  if (status === "maybe") return "Moze";
  if (status === "unavailable") return "Niedostepny";
  return "Brak odp.";
}

function formatSessionStatus(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "IN_PROGRESS") return "Trwa";
  if (normalized === "PLANNED") return "Zaplanowana";
  if (normalized === "FINISHED") return "Zakonczona";
  return normalized || "Nieznany";
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
  return campaign?.owner ? "GM" : "Gracz";
}

function pickSessionImage(session) {
  return session?.imageUrl || session?.bannerImageUrl || session?.campaignBannerImageUrl || session?.sceneImageUrl || session?.coverImageUrl || session?.campaignCoverImageUrl || "";
}

function RoleDonutChart({ items, total }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const visibleItems = items.filter((item) => Number(item.value || 0) > 0);
  const positiveTotal = visibleItems.reduce((sum, item) => sum + Math.max(0, Number(item.value || 0)), 0);
  const activeItem = activeIndex == null ? null : visibleItems[activeIndex];
  let offset = 25;

  return (
    <div className="dashboardRoleChart2026">
      <svg className="dashboardRoleSvg2026" viewBox="0 0 120 120" role="img" aria-label="Diagram kampanii wedlug roli GM i gracz">
        <circle className="dashboardRoleTrack2026" cx="60" cy="60" r="42" />
        {positiveTotal > 0 ? visibleItems.map((item, index) => {
          const value = Math.max(0, Number(item.value || 0));
          const dash = (value / positiveTotal) * 263.89;
          const node = (
            <circle
              key={item.label}
              className={`dashboardRoleSegment2026${activeIndex === index ? " is-active" : ""}`}
              cx="60"
              cy="60"
              r="42"
              stroke={item.color}
              strokeDasharray={`${dash} ${263.89 - dash}`}
              strokeDashoffset={-offset}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              tabIndex={0}
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
          offset += dash;
          return node;
        }) : null}
      </svg>
      <div className="dashboardRoleLegend2026">
        {visibleItems.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={`dashboardRoleLegendItem2026${activeIndex === index ? " is-active" : ""}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
          >
            <span style={{ background: item.color }} aria-hidden="true" />
            <strong>{item.label}</strong>
            <em>{item.value}</em>
          </button>
        ))}
      </div>
      <div className={`dashboardRoleTooltip2026${activeItem ? " is-visible" : ""}`} role="status" aria-live="polite">
        {activeItem ? `${activeItem.label}: ${activeItem.value}` : `Lacznie kampanii: ${total}`}
      </div>
    </div>
  );
}

function AvailabilityDot({ status }) {
  const normalized = status || "none";
  return (
    <span
      className={`dashboardAvailabilityDot is-${normalized}`}
      title={availabilityStatusLabel(normalized)}
      aria-label={availabilityStatusLabel(normalized)}
    />
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <article className="dashboardStatCard">
      <span className="dashboardStatIcon" aria-hidden="true"><DashboardIcon name={icon} /></span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
        {hint ? <em>{hint}</em> : null}
      </span>
    </article>
  );
}

function PanelHeader({ title, subtitle, to }) {
  return (
    <header className="dashboardPanel__head dashboardPanelHead2026">
      <div>
        <h2>{title}</h2>
        {subtitle ? <small>{subtitle}</small> : null}
      </div>
      {to ? <Link to={to}>Zobacz wszystkie</Link> : null}
    </header>
  );
}

function campaignUpdatedAt(campaign) {
  return campaign?.updatedAt || campaign?.createdAt || 0;
}

function buildActivity(campaigns, characters, sessions) {
  const campaignRows = campaigns.map((campaign) => ({
    id: `campaign-${campaign.id}`,
    icon: "briefcase",
    text: `Kampania ${campaign.title || "bez nazwy"} jest dostepna w twoim workspace.`,
    time: campaignUpdatedAt(campaign),
    fallback: "Kampania",
  }));
  const characterRows = characters.map((character) => ({
    id: `character-${character.id}`,
    icon: "users",
    text: `Postac ${character.name || "bez nazwy"} jest gotowa do gry.`,
    time: character.updatedAt || character.createdAt || 0,
    fallback: "Postac",
  }));
  const sessionRows = sessions.map((session) => ({
    id: `session-${session.id}`,
    icon: "calendar",
    text: `${session.title || "Sesja"} - ${formatSessionStatus(session.status)} w kampanii ${session.campaignTitle || "bez nazwy"}.`,
    time: session.finishedAt || session.scheduledFor || 0,
    fallback: "Sesja",
  }));

  return [...campaignRows, ...characterRows, ...sessionRows]
    .sort((a, b) => toTimestamp(b.time) - toTimestamp(a.time))
    .slice(0, ACTIVITY_LIMIT);
}

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedAttendanceCampaignId, setSelectedAttendanceCampaignId] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [attendanceMembers, setAttendanceMembers] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              campaignBannerImageUrl: campaign?.bannerImageUrl || "",
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

  const attendanceCampaigns = useMemo(
    () => campaigns
      .map((campaign) => {
        const campaignSessions = sessions.filter((session) => String(session.campaignId) === String(campaign.id));
        return { campaign, session: pickAvailabilitySession(campaignSessions) };
      })
      .filter((item) => item.session)
      .sort((a, b) => toTimestamp(a.session.scheduledFor) - toTimestamp(b.session.scheduledFor))
      .map((item) => item.campaign),
    [campaigns, sessions],
  );

  useEffect(() => {
    if (attendanceCampaigns.length === 0) {
      setSelectedAttendanceCampaignId("");
      return;
    }

    const selectedExists = attendanceCampaigns.some((campaign) => String(campaign.id) === String(selectedAttendanceCampaignId));
    if (!selectedExists) {
      setSelectedAttendanceCampaignId(String(attendanceCampaigns[0].id));
    }
  }, [attendanceCampaigns, selectedAttendanceCampaignId]);

  const selectedAttendanceCampaign = useMemo(
    () => attendanceCampaigns.find((campaign) => String(campaign.id) === String(selectedAttendanceCampaignId)) || null,
    [attendanceCampaigns, selectedAttendanceCampaignId],
  );

  const selectedAttendanceSessions = useMemo(
    () => sessions.filter((session) => String(session.campaignId) === String(selectedAttendanceCampaignId)),
    [sessions, selectedAttendanceCampaignId],
  );

  const attendanceSession = useMemo(
    () => pickAvailabilitySession(selectedAttendanceSessions),
    [selectedAttendanceSessions],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      if (!selectedAttendanceCampaignId || !attendanceSession?.id) {
        setAttendance(null);
        setAttendanceMembers([]);
        setAttendanceError("");
        setAttendanceLoading(false);
        return;
      }

      setAttendanceLoading(true);
      setAttendanceError("");
      try {
        const [attendanceResult, memberResult] = await Promise.allSettled([
          getSessionAttendance(token, selectedAttendanceCampaignId, attendanceSession.id),
          listCampaignMembers(token, selectedAttendanceCampaignId),
        ]);
        if (cancelled) return;
        if (attendanceResult.status === "rejected") throw attendanceResult.reason;

        setAttendance(attendanceResult.value);
        setAttendanceMembers(memberResult.status === "fulfilled" ? normalizeArray(memberResult.value) : []);
      } catch (err) {
        if (!cancelled) {
          setAttendance(null);
          setAttendanceMembers([]);
          setAttendanceError(err?.message || "Nie udalo sie pobrac obecnosci graczy.");
        }
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    }

    void loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [token, selectedAttendanceCampaignId, attendanceSession?.id]);

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

  const recentCampaigns = useMemo(
    () => campaigns.slice().sort((a, b) => toTimestamp(campaignUpdatedAt(b)) - toTimestamp(campaignUpdatedAt(a))).slice(0, PREVIEW_LIMIT),
    [campaigns],
  );

  const activityRows = useMemo(() => buildActivity(campaigns, characters, sessions), [campaigns, characters, sessions]);
  const roleStats = useMemo(() => countRole(campaigns), [campaigns]);
  const availabilityRows = useMemo(() => buildAvailabilityRows(attendanceMembers, attendance), [attendanceMembers, attendance]);

  const heroTitle = hero.mode === "active" ? "Aktywna sesja" : hero.mode === "planned" ? "Najblizsza sesja" : "Brak najblizszej sesji";
  const heroSession = hero.session;
  const heroImage = pickSessionImage(heroSession) || imagePlaceholder("campaignBanners");
  const roleChartItems = [
    { label: "Prowadzisz jako GM", value: roleStats.asOwner, color: "#1f765f" },
    { label: "Grasz jako gracz", value: roleStats.asMember, color: "#d18b1f" },
  ];
  return (
    <div className="page dashboardSaas dashboardWorkbench2026">
      <article className="dashboardHero dashboardHero2026">
        <div className="dashboardHero__copy">
          <span>{heroTitle.toUpperCase()}</span>
          {heroSession ? (
            <>
              <h2>{heroSession.title || "Sesja"}</h2>
              <p>{heroSession.campaignTitle || "Kampania"} - {formatDateTime(heroSession.scheduledFor)}</p>
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
              <h2>Nie masz jeszcze zaplanowanej sesji</h2>
              <p>Przydaloby sie to zmienic: zaplanuj termin w kampanii, a ten panel pokaze najblizsze spotkanie druzyny.</p>
              <div className="dashboardHero__actions">
                <Link className="dashboardHero__secondary" to="/campaigns">
                  <DashboardIcon name="briefcase" />
                  Przejdz do kampanii
                </Link>
              </div>
            </>
          )}
        </div>
        <img src={heroImage} alt={heroSession?.title || "Placeholder banera sesji"} className="dashboardHero__image" />
      </article>

      <section className="dashboardWorkspaceGrid2026">
        <main className="dashboardMainColumn2026">
          <section className="dashboardStatsGrid2026" aria-label="Statystyki dashboardu">
            <StatCard icon="briefcase" label="Aktywne kampanie" value={campaigns.length} hint={`${roleStats.asOwner} jako GM`} />
            <StatCard icon="users" label="Postacie" value={characters.length} hint="Gotowe karty" />
            <StatCard icon="calendar" label="Nadchodzace sesje" value={plannedSessions.length} hint="Najblizszy termin" />
            <StatCard icon="archive" label="Odbyte sesje" value={finishedSessions.length} hint="Historia gry" />
          </section>

          <section className="dashboardMainSplit2026">
            <article className="dashboardPanel dashboardListPanel2026">
              <PanelHeader title="Ostatnie kampanie" subtitle="Kampanie, do ktorych najczesciej wracasz" to="/campaigns" />
              <div className="dashboardList2026 scrollRegion">
                {recentCampaigns.length === 0 ? (
                  <div className="dashboardEmpty2026">Brak kampanii. Utworz albo dolacz do kampanii, aby zobaczyc ja tutaj.</div>
                ) : recentCampaigns.map((campaign) => (
                  <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="dashboardCampaignRow2026">
                    <span className="dashboardRowThumb2026" aria-hidden="true"><DashboardIcon name="briefcase" /></span>
                    <span>
                      <strong>{campaign.title || "Kampania"}</strong>
                      <small>{(campaign.systemCode || "RPG").toUpperCase()} - {getCampaignRoleLabel(campaign)}</small>
                    </span>
                    <em>{formatSessionStatus(campaign.status)}</em>
                  </Link>
                ))}
              </div>
            </article>

            <article className="dashboardPanel dashboardListPanel2026">
              <PanelHeader title="Nadchodzace sesje" subtitle="Najblizsze terminy w twoich kampaniach" to="/campaigns" />
              <div className="dashboardList2026 scrollRegion">
                {plannedSessions.length === 0 ? (
                  <div className="dashboardEmpty2026">Brak zaplanowanych sesji.</div>
                ) : plannedSessions.slice(0, PREVIEW_LIMIT).map((session) => {
                  const date = formatCompactDate(session.scheduledFor);
                  return (
                    <Link key={session.id} to={`/campaigns/${session.campaignId}`} className="dashboardSessionRow2026">
                      <span className="dashboardDateBadge2026"><strong>{date.day}</strong><small>{date.month}</small></span>
                      <span>
                        <strong>{session.title || "Sesja"}</strong>
                        <small>{session.campaignTitle || "Kampania"}</small>
                      </span>
                      <em>{formatDateTime(session.scheduledFor).split(", ").pop()}</em>
                    </Link>
                  );
                })}
              </div>
            </article>
          </section>

          <article className="dashboardPanel dashboardActivityPanel2026">
            <PanelHeader title="Ostatnia aktywnosc" subtitle="Szybki przeglad zmian w twoim workspace" />
            <div className="dashboardActivityList2026 scrollRegion">
              {activityRows.length === 0 ? (
                <div className="dashboardEmpty2026">Brak aktywnosci do pokazania.</div>
              ) : activityRows.map((item) => (
                <div key={item.id} className="dashboardActivityRow2026">
                  <span aria-hidden="true"><DashboardIcon name={item.icon} /></span>
                  <strong>{item.text}</strong>
                  <small>{item.time ? formatDateTime(item.time) : item.fallback}</small>
                </div>
              ))}
            </div>
          </article>
        </main>

        <aside className="dashboardRightColumn2026">
          <article className="dashboardPanel dashboardRolePanel2026">
            <PanelHeader title="Rola w kampaniach" subtitle="Podzial twoich kampanii" />
            <RoleDonutChart items={roleChartItems} total={roleStats.total} />
          </article>

          <article className="dashboardPanel dashboardAvailabilityPanel2026">
            <PanelHeader title="Obecnosc graczy" subtitle={attendanceSession?.title || "Najblizsza sesja"} />

            {attendanceCampaigns.length > 0 ? (
              <div className="dashboardCampaignTabs2026" role="tablist" aria-label="Kampanie obecnosci">
                {attendanceCampaigns.map((campaign) => {
                  const selected = String(campaign.id) === String(selectedAttendanceCampaignId);
                  return (
                    <button
                      key={campaign.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={`dashboardCampaignTab2026${selected ? " is-active" : ""}`}
                      onClick={() => setSelectedAttendanceCampaignId(String(campaign.id))}
                    >
                      {campaign.title || "Kampania"}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="dashboardAvailabilityTableWrap2026">
              {attendanceCampaigns.length === 0 ? (
                <div className="dashboardEmpty2026">Brak kampanii z sesjami do pokazania obecnosci.</div>
              ) : !attendanceSession ? (
                <div className="dashboardEmpty2026">Brak aktywnej lub zaplanowanej sesji w kampanii {selectedAttendanceCampaign?.title || ""}.</div>
              ) : attendanceLoading ? (
                <div className="dashboardEmpty2026">Ladowanie obecnosci graczy...</div>
              ) : attendanceError ? (
                <div className="dashboardEmpty2026">{attendanceError}</div>
              ) : availabilityRows.length === 0 ? (
                <div className="dashboardEmpty2026">Brak graczy lub odpowiedzi dla wybranej sesji.</div>
              ) : (
                <>
                  <div className="dashboardAvailabilityTable2026" role="table" aria-label="Obecnosc graczy w tygodniu">
                    <div className="dashboardAvailabilityHeader2026" role="row">
                      <span role="columnheader">Gracz</span>
                      {WEEK_DAYS.map((day) => <span key={day} role="columnheader">{day}</span>)}
                    </div>
                    {availabilityRows.map((row) => (
                      <div key={row.id} className="dashboardAvailabilityRow2026" role="row">
                        <strong role="rowheader">{row.name}</strong>
                        {WEEK_DAYS.map((day) => <AvailabilityDot key={`${row.id}-${day}`} status={row.week[day]} />)}
                      </div>
                    ))}
                  </div>
                  <div className="dashboardAvailabilityLegend2026">
                    <span><AvailabilityDot status="available" /> Dostepny</span>
                    <span><AvailabilityDot status="maybe" /> Moze</span>
                    <span><AvailabilityDot status="unavailable" /> Niedostepny</span>
                    <span><AvailabilityDot status="none" /> Brak odp.</span>
                  </div>
                </>
              )}
            </div>
          </article>
        </aside>
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
