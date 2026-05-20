import { Link } from "react-router-dom";

function statusLabel(status) {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "FINISHED") return "FINISHED";
  return "PLANNED";
}

export default function CampaignSessionsPanel({ campaignId, sessions, isOwner, busy, onCreate, onStart, onFinish }) {
  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Sesje kampanii</h2>

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
            onCreate({ title, description, scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null });
            event.currentTarget.reset();
          }}
        >
          <label className="campaignField"><span>Tytul</span><input name="title" required /></label>
          <label className="campaignField"><span>Opis</span><input name="description" /></label>
          <label className="campaignField"><span>Termin</span><input name="scheduledFor" type="datetime-local" /></label>
          <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy}>Utworz sesje</button>
        </form>
      )}

      {sessions.length === 0 ? (
        <div className="campaignDetailsEmpty">Brak sesji kampanii.</div>
      ) : (
        <div className="campaignMaterialList">
          {sessions.map((session) => (
            <article key={session.id} className="campaignMaterialCard">
              <div className="campaignMaterialCard__top">
                <strong>{session.title}</strong>
                <span className="campaignMemberBadge">{statusLabel(session.status)}</span>
              </div>
              <p>{session.description || "Brak opisu sesji."}</p>
              <div className="campaignMaterialMeta">
                <span>Termin: {session.scheduledFor ? new Date(session.scheduledFor).toLocaleString("pl-PL") : "-"}</span>
                <span>ID: {session.id}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link className="campaignDetailsGhostBtn" to={`/campaigns/${campaignId}/sessions/${session.id}/live`}>
                  Live room (coming soon)
                </Link>
                {isOwner && session.status === "PLANNED" && (
                  <button className="campaignDetailsPrimaryBtn" type="button" disabled={busy} onClick={() => onStart(session.id)}>Start</button>
                )}
                {isOwner && session.status === "IN_PROGRESS" && (
                  <button className="campaignDetailsDangerBtn" type="button" disabled={busy} onClick={() => onFinish(session.id)}>Finish</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
