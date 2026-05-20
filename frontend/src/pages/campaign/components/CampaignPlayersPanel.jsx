export default function CampaignPlayersPanel({ members }) {
  return (
    <section className="campaignDetailsCard panel-soft">
      <div className="campaignMaterialCard__top">
        <h2 className="campaignDetailsCardTitle">Gracze</h2>
        <span className="campaignMemberBadge">{members.length}</span>
      </div>
      {members.length === 0 ? (
        <div className="campaignDetailsEmpty">Brak graczy w kampanii.</div>
      ) : (
        <div className="campaignMaterialList">
          {members.map((member) => (
            <article key={member.userId} className="campaignMaterialCard">
              <div className="campaignMaterialCard__top">
                <strong>{member.displayName || member.username || "Gracz"}</strong>
                <span className="campaignMemberBadge">{member.role || "player"}</span>
              </div>
              <div className="campaignMaterialMeta">
                <span>@{member.username || "-"}</span>
                <span>#{member.tagCode ?? "-"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
