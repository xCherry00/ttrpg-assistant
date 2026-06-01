import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { getSessionAttendance, updateMySessionAttendance } from "../../../api/campaigns";

const WEEK_DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
const LEGACY_WEEK_DAYS = ["Dzis", "Jutro", "Pojutrze", "Czw", "Pt", "Sob", "Nd"];
const ASCII_WEEK_DAYS = ["Pn", "Wt", "Sr", "Cz", "Pt", "Sb", "Nd"];
const WEEK_NOTE_PREFIX = "AVAILABILITY_WEEK_V1:";
const EMPTY_WEEK = Object.fromEntries(WEEK_DAYS.map((day) => [day, "none"]));

function toTimestamp(value) {
  const ts = new Date(value || 0).getTime();
  return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
}

function pickAvailabilitySession(sessions) {
  const planned = sessions
    .filter((session) => String(session.status || "").toUpperCase() === "PLANNED")
    .slice()
    .sort((a, b) => toTimestamp(a.scheduledFor) - toTimestamp(b.scheduledFor));
  if (planned.length > 0) return planned[0];
  return sessions.find((session) => String(session.status || "").toUpperCase() === "IN_PROGRESS") || sessions[0] || null;
}

function normalizeStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "AVAILABLE" || value === "available") return "available";
  if (value === "MAYBE" || value === "maybe") return "maybe";
  if (value === "UNAVAILABLE" || value === "unavailable") return "unavailable";
  return "none";
}

function apiStatusFromWeek(week) {
  const values = Object.values(week || {});
  if (values.includes("available")) return "AVAILABLE";
  if (values.includes("maybe")) return "MAYBE";
  if (values.includes("unavailable")) return "UNAVAILABLE";
  return "MAYBE";
}

function parseWeekNote(note, fallbackStatus = "none") {
  const raw = String(note || "");
  if (raw.startsWith(WEEK_NOTE_PREFIX)) {
    try {
      const parsed = JSON.parse(raw.slice(WEEK_NOTE_PREFIX.length));
      const normalized = { ...EMPTY_WEEK };
      WEEK_DAYS.forEach((day, index) => {
        normalized[day] = normalizeStatus(parsed?.[day] || parsed?.[ASCII_WEEK_DAYS[index]] || parsed?.[LEGACY_WEEK_DAYS[index]]);
      });
      return normalized;
    } catch {
      return { ...EMPTY_WEEK };
    }
  }
  return { ...EMPTY_WEEK, Pn: normalizeStatus(fallbackStatus) };
}

function stringifyWeekNote(week) {
  return `${WEEK_NOTE_PREFIX}${JSON.stringify(week)}`;
}

function displayName(item, index) {
  return item?.displayName || item?.username || item?.name || `Gracz ${index + 1}`;
}

function statusLabel(status) {
  if (status === "available") return "Dostepny";
  if (status === "maybe") return "Moze";
  if (status === "unavailable") return "Niedostepny";
  return "Brak odp.";
}

function AvailabilityDot({ status }) {
  return <span className={`campaignAvailabilityDot is-${status}`} title={statusLabel(status)} aria-label={statusLabel(status)} />;
}

export default function CampaignAvailabilityPanel({ campaignId, sessions, members }) {
  const { token } = useAuth();
  const session = useMemo(() => pickAvailabilitySession(sessions || []), [sessions]);
  const [attendance, setAttendance] = useState(null);
  const [week, setWeek] = useState({ ...EMPTY_WEEK });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const myResponse = useMemo(() => attendance?.responses?.find((item) => item.self), [attendance]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.id) {
        setAttendance(null);
        setWeek({ ...EMPTY_WEEK });
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await getSessionAttendance(token, campaignId, session.id);
        if (cancelled) return;
        setAttendance(data);
        const self = data?.responses?.find((item) => item.self);
        setWeek(parseWeekNote(self?.note, self?.status));
      } catch (err) {
        if (!cancelled) setError(err?.message || "Nie udalo sie pobrac dostepnosci.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, campaignId, session?.id]);

  function setDay(day, status) {
    setWeek((current) => ({ ...current, [day]: status }));
  }

  async function saveWeek() {
    if (!session?.id) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = { status: apiStatusFromWeek(week), note: stringifyWeekNote(week) };
      const data = await updateMySessionAttendance(token, campaignId, session.id, payload);
      setAttendance(data);
      setNotice("Zapisano dostepnosc na tydzien.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie zapisac dostepnosci.");
    } finally {
      setSaving(false);
    }
  }

  const rows = useMemo(() => {
    const responses = Array.isArray(attendance?.responses) ? attendance.responses : [];
    if (responses.length > 0) {
      return responses.map((response, index) => ({
        id: response.userId || response.id || index,
        name: displayName(response, index),
        week: parseWeekNote(response.note, response.status),
      }));
    }
    return (members || []).map((member, index) => ({
      id: member.id || member.userId || index,
      name: displayName(member, index),
      week: { ...EMPTY_WEEK },
    }));
  }, [attendance, members]);

  return (
    <section className="campaignDetailsCard panel-soft campaignAvailabilityPanel">
      <div className="campaignAvailabilityHeader">
        <div>
          <h2 className="campaignDetailsCardTitle">Dostepnosc</h2>
          <p className="campaignDetailsHelpText">
            Zaznacz, kiedy pasuje Ci gra w tygodniu najblizszej sesji. Dane sa zapisywane w odpowiedzi frekwencji sesji.
          </p>
        </div>
        <span className="campaignMemberBadge">{session?.title || "Brak sesji"}</span>
      </div>

      {!session ? <div className="campaignDetailsEmpty">Brak sesji, dla ktorej mozna zbierac dostepnosc.</div> : null}
      {loading ? <div className="campaignDetailsEmpty">Ladowanie dostepnosci...</div> : null}
      {error ? <div className="campaignDetailsError">{error}</div> : null}
      {notice ? <div className="campaignDetailsNotice">{notice}</div> : null}

      {session && !loading ? (
        <div className="campaignAvailabilityWorkspace">
          <div className="campaignAvailabilityVoteCard">
            <strong>Twoja dostepnosc</strong>
            <small>{myResponse?.status ? `Aktualny status sesji: ${myResponse.status}` : "Nie zapisano jeszcze odpowiedzi."}</small>
            <div className="campaignAvailabilityWeekEditor" aria-label="Twoja tygodniowa dostepnosc">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="campaignAvailabilityDayEditor">
                  <span>{day}</span>
                  <div>
                    {[
                      ["available", "Dostepny"],
                      ["maybe", "Moze"],
                      ["unavailable", "Nie"],
                      ["none", "-"],
                    ].map(([status, label]) => (
                      <button
                        key={status}
                        type="button"
                        className={`campaignAvailabilityChoice is-${status}${week[day] === status ? " is-active" : ""}`}
                        onClick={() => setDay(day, status)}
                        disabled={saving}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="campaignDetailsPrimaryBtn" type="button" disabled={saving} onClick={saveWeek}>
              {saving ? "Zapisywanie..." : "Zapisz dostepnosc"}
            </button>
          </div>

          <div className="campaignAvailabilityTableCard">
            <strong>Podglad graczy</strong>
            <div className="campaignAvailabilityTable" role="table" aria-label="Dostepnosc graczy w tygodniu">
              <div className="campaignAvailabilityTableHead" role="row">
                <span role="columnheader">Gracz</span>
                {WEEK_DAYS.map((day) => <span key={day} role="columnheader">{day}</span>)}
              </div>
              {rows.length === 0 ? (
                <div className="campaignDetailsEmpty">Brak odpowiedzi graczy.</div>
              ) : rows.map((row) => (
                <div key={row.id} className="campaignAvailabilityTableRow" role="row">
                  <strong role="rowheader">{row.name}</strong>
                  {WEEK_DAYS.map((day) => <AvailabilityDot key={`${row.id}-${day}`} status={row.week[day] || "none"} />)}
                </div>
              ))}
            </div>
            <div className="campaignAvailabilityLegend">
              <span><AvailabilityDot status="available" /> Dostepny</span>
              <span><AvailabilityDot status="maybe" /> Moze</span>
              <span><AvailabilityDot status="unavailable" /> Niedostepny</span>
              <span><AvailabilityDot status="none" /> Brak odp.</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
