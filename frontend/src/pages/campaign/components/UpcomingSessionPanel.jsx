import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { getSessionAttendance, updateMySessionAttendance } from "../../../api/campaigns";

function toTimestamp(value) {
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
}

function pickSessionForOwner(sessions) {
  const planned = sessions
    .filter((session) => session.status === "PLANNED")
    .slice()
    .sort((a, b) => toTimestamp(a.scheduledFor) - toTimestamp(b.scheduledFor));
  if (planned.length > 0) return planned[0];
  return sessions.find((session) => session.status === "IN_PROGRESS") || null;
}

function pickSessionForPlayer(sessions) {
  const active = sessions.find((session) => session.status === "IN_PROGRESS");
  if (active) return active;
  const planned = sessions
    .filter((session) => session.status === "PLANNED")
    .slice()
    .sort((a, b) => toTimestamp(a.scheduledFor) - toTimestamp(b.scheduledFor));
  return planned[0] || null;
}

function sessionStatusLabel(status) {
  const value = String(status || "").toUpperCase();
  if (value === "IN_PROGRESS") return "Trwa";
  if (value === "FINISHED") return "Zakończona";
  if (value === "PLANNED") return "Zaplanowana";
  return "Nieznany";
}

function attendanceStatusLabel(status) {
  const value = String(status || "").toUpperCase();
  if (value === "AVAILABLE") return "Będę";
  if (value === "MAYBE") return "Może";
  if (value === "UNAVAILABLE") return "Nie będę";
  return "Brak odpowiedzi";
}

export default function UpcomingSessionPanel({
  campaignId,
  sessions,
  isOwner,
  busy,
  onStart,
  onFinish,
  onCreate,
}) {
  const { token } = useAuth();
  const session = isOwner ? pickSessionForOwner(sessions) : pickSessionForPlayer(sessions);
  const sessionId = session?.id;
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [note, setNote] = useState("");
  const [savingStatus, setSavingStatus] = useState("");
  const [attendanceError, setAttendanceError] = useState("");

  const myResponse = useMemo(
    () => attendance?.responses?.find((item) => item.self),
    [attendance],
  );

  useEffect(() => {
    async function loadAttendance() {
      if (!session) {
        setAttendance(null);
        setAttendanceError("");
        return;
      }
      try {
        setAttendanceLoading(true);
        setAttendanceError("");
        const data = await getSessionAttendance(token, campaignId, sessionId);
        setAttendance(data);
        const self = data?.responses?.find((item) => item.self);
        setNote(self?.note || "");
      } catch (err) {
        setAttendanceError(err?.message || "Nie udało się pobrać frekwencji.");
      } finally {
        setAttendanceLoading(false);
      }
    }
    void loadAttendance();
  }, [token, campaignId, session, sessionId]);

  async function vote(status) {
    if (!sessionId) return;
    setSavingStatus(status);
    setAttendanceError("");
    try {
      const data = await updateMySessionAttendance(token, campaignId, sessionId, { status, note });
      setAttendance(data);
    } catch (err) {
      setAttendanceError(err?.message || "Nie udało się zapisać odpowiedzi.");
    } finally {
      setSavingStatus("");
    }
  }

  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Nadchodząca sesja</h2>
      {!session ? (
        <div className="campaignDetailsEmpty">Brak zaplanowanej ani aktywnej sesji.</div>
      ) : (
        <>
          <div className="campaignMaterialCard__top">
            <strong>{session.title}</strong>
            <span className="campaignMemberBadge">{sessionStatusLabel(session.status)}</span>
          </div>
          <p>{session.description || "Brak opisu sesji."}</p>
          <div className="campaignMaterialMeta">
            <span>Termin: {session.scheduledFor ? new Date(session.scheduledFor).toLocaleString("pl-PL") : "-"}</span>
            <span>ID: {session.id}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {session.status === "PLANNED" && isOwner && (
              <button
                className="campaignDetailsPrimaryBtn"
                type="button"
                disabled={busy}
                onClick={() => onStart?.(session.id)}
              >
                Rozpocznij sesję
              </button>
            )}
            {session.status === "PLANNED" && !isOwner && (
              <button className="campaignDetailsGhostBtn" type="button" disabled>
                Sesja jeszcze się nie rozpoczęła
              </button>
            )}
            {session.status === "IN_PROGRESS" && (
              <Link className="campaignDetailsPrimaryBtn" to={`/campaigns/${campaignId}/sessions/${session.id}/live`}>
                Dołącz do aktywnej sesji
              </Link>
            )}
            {session.status === "IN_PROGRESS" && isOwner && (
              <button
                className="campaignDetailsDangerBtn"
                type="button"
                disabled={busy}
                onClick={() => onFinish?.(session.id)}
              >
                Zakończ sesję
              </button>
            )}
          </div>
          <hr />
          <div>
            <strong>Frekwencja</strong>
            {attendanceLoading ? (
              <p>Ładowanie frekwencji...</p>
            ) : !attendance ? (
              <p>Brak sesji do głosowania.</p>
            ) : (
              <>
                <p>Twój status: {attendanceStatusLabel(myResponse?.status)}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <button className="campaignDetailsPrimaryBtn" type="button" disabled={Boolean(savingStatus)} onClick={() => vote("AVAILABLE")}>Będę</button>
                  <button className="campaignDetailsGhostBtn" type="button" disabled={Boolean(savingStatus)} onClick={() => vote("MAYBE")}>Może</button>
                  <button className="campaignDetailsDangerBtn" type="button" disabled={Boolean(savingStatus)} onClick={() => vote("UNAVAILABLE")}>Nie będę</button>
                </div>
                <label className="campaignField">
                  <span>Notatka (opcjonalna)</span>
                  <textarea value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} rows={2} disabled={Boolean(savingStatus)} />
                </label>
                <div className="campaignMaterialMeta">
                  <span>Będę: {attendance.availableCount}</span>
                  <span>Może: {attendance.maybeCount}</span>
                  <span>Nie będę: {attendance.unavailableCount}</span>
                  <span>Brak odpowiedzi: {attendance.noResponseCount}</span>
                </div>
              </>
            )}
            {attendanceError && <div className="campaignDetailsError">{attendanceError}</div>}
          </div>
        </>
      )}
      {isOwner && (
        <form
          className="campaignFormCard"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const title = String(formData.get("title") || "").trim();
            const description = String(formData.get("description") || "").trim();
            const scheduledFor = String(formData.get("scheduledFor") || "");
            if (!title) return;
            onCreate?.({ title, description, scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null });
            event.currentTarget.reset();
          }}
        >
          <strong>Dodaj / zaplanuj sesję</strong>
          <label className="campaignField"><span>Tytuł</span><input name="title" required /></label>
          <label className="campaignField"><span>Opis</span><input name="description" /></label>
          <label className="campaignField"><span>Termin</span><input name="scheduledFor" type="datetime-local" /></label>
          <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy}>Zaplanuj sesję</button>
        </form>
      )}
    </section>
  );
}
