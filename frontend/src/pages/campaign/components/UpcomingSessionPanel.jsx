import { Link } from "react-router-dom";

function pickUpcomingOrActiveSession(sessions) {
  const active = sessions.find((session) => session.status === "IN_PROGRESS");
  if (active) return active;
  const planned = sessions.find((session) => session.status === "PLANNED");
  return planned || null;
}

export default function UpcomingSessionPanel({ campaignId, sessions }) {
  const session = pickUpcomingOrActiveSession(sessions);

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
          {session.status === "IN_PROGRESS" ? (
            <Link className="campaignDetailsPrimaryBtn" to={`/campaigns/${campaignId}/sessions/${session.id}/live`}>
              Dolacz do aktywnej sesji
            </Link>
          ) : (
            <button className="campaignDetailsGhostBtn" type="button" disabled>
              Sesja jeszcze nie rozpoczeta
            </button>
          )}
        </>
      )}
    </section>
  );
}
