import { Link } from "react-router-dom";

export default function CampaignToolsPanel({ campaignId, activeSession }) {
  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Campaign tools</h2>
      <p className="campaignDetailsHelpText">
        /dice i /initiative sa globalnymi narzedziami. LiveSessionPage bedzie osobnym active-session workspace z embedded panelami.
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        <Link className="campaignDetailsPrimaryBtn" to="/initiative">Otworz global Initiative tool</Link>
        <Link className="campaignDetailsPrimaryBtn" to="/dice">Otworz global Dice tool</Link>
        {activeSession ? (
          <Link className="campaignDetailsGhostBtn" to={`/campaigns/${campaignId}/sessions/${activeSession.id}/live`}>
            Wejdz do live room (coming soon)
          </Link>
        ) : (
          <button className="campaignDetailsGhostBtn" type="button" disabled>
            Live room (coming soon)
          </button>
        )}
      </div>
    </section>
  );
}
