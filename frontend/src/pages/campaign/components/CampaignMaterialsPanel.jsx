export default function CampaignMaterialsPanel({ materials, materialsAvailable = true }) {
  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Materiały kampanii</h2>
      {!materialsAvailable ? (
        <div className="campaignDetailsEmpty">Materiały kampanii są chwilowo niedostępne.</div>
      ) : materials.length === 0 ? (
        <div className="campaignDetailsEmpty">Brak materiałów.</div>
      ) : (
        <div className="campaignMaterialList">
          {materials.map((material) => (
            <article key={material.id} className="campaignMaterialCard">
              <div className="campaignMaterialCard__top">
                <strong>{material.title || "Bez tytułu"}</strong>
                <span className="campaignMemberBadge">{material.type || "NOTE"}</span>
              </div>
              <p>{material.content || material.description || "Brak treści"}</p>
              <div className="campaignMaterialMeta">
                <span>{material.url || material.link || ""}</span>
                <span>{material.updatedAt ? new Date(material.updatedAt).toLocaleString("pl-PL") : ""}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
