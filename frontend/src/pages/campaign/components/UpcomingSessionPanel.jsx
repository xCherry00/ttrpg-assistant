import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { getSessionAttendance, updateMySessionAttendance } from "../../../api/campaigns";

function pickUpcomingOrActiveSession(sessions) {
  const active = sessions.find((session) => session.status === "IN_PROGRESS");
  if (active) return active;
  const planned = sessions.find((session) => session.status === "PLANNED");
  return planned || null;
}

export default function UpcomingSessionPanel({
  campaignId,
  sessions,
  isOwner,
  busy,
  onStart,
  onFinish,
}) {
  const { token } = useAuth();
  const session = pickUpcomingOrActiveSession(sessions);
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
        setAttendanceError(err?.message || "Nie udalo sie pobrac frekwencji.");
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
      setAttendanceError(err?.message || "Nie udalo sie zapisac odpowiedzi.");
    } finally {
      setSavingStatus("");
    }
  }

  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Nadchodzaca sesja</h2>
      {!session ? (
        <div className="campaignDetailsEmpty">Brak zaplanowanej ani aktywnej sesji.</div>
      ) : (
        <>
          <div className="campaignMaterialCard__top">
            <strong>{session.title}</strong>
            <span className="campaignMemberBadge">{session.status}</span>
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
                Rozpocznij sesje
              </button>
            )}
            {session.status === "PLANNED" && !isOwner && (
              <button className="campaignDetailsGhostBtn" type="button" disabled>
                Sesja jeszcze sie nie rozpoczela
              </button>
            )}
            {session.status === "IN_PROGRESS" && (
              <Link className="campaignDetailsPrimaryBtn" to={`/campaigns/${campaignId}/sessions/${session.id}/live`}>
                Dolacz do aktywnej sesji
              </Link>
            )}
            {session.status === "IN_PROGRESS" && isOwner && (
              <button
                className="campaignDetailsDangerBtn"
                type="button"
                disabled={busy}
                onClick={() => onFinish?.(session.id)}
              >
                Zakoncz sesje
              </button>
            )}
          </div>
          <hr />
          <div>
            <strong>Frekwencja</strong>
            {attendanceLoading ? (
              <p>Ladowanie frekwencji...</p>
            ) : !attendance ? (
              <p>Brak sesji do glosowania.</p>
            ) : (
              <>
                <p>Twoj status: {myResponse?.status || "NO_RESPONSE"}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <button className="campaignDetailsPrimaryBtn" type="button" disabled={Boolean(savingStatus)} onClick={() => vote("AVAILABLE")}>Bede</button>
                  <button className="campaignDetailsGhostBtn" type="button" disabled={Boolean(savingStatus)} onClick={() => vote("MAYBE")}>Moze</button>
                  <button className="campaignDetailsDangerBtn" type="button" disabled={Boolean(savingStatus)} onClick={() => vote("UNAVAILABLE")}>Nie bede</button>
                </div>
                <label className="campaignField">
                  <span>Notatka (opcjonalna)</span>
                  <textarea value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} rows={2} disabled={Boolean(savingStatus)} />
                </label>
                <div className="campaignMaterialMeta">
                  <span>available: {attendance.availableCount}</span>
                  <span>maybe: {attendance.maybeCount}</span>
                  <span>unavailable: {attendance.unavailableCount}</span>
                  <span>no response: {attendance.noResponseCount}</span>
                </div>
              </>
            )}
            {attendanceError && <div className="campaignDetailsError">{attendanceError}</div>}
          </div>
        </>
      )}
    </section>
  );
}
