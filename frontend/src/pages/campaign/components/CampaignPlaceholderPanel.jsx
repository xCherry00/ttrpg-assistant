export default function CampaignPlaceholderPanel({ title, text, actionLabel }) {
  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">{title}</h2>
      <p className="campaignDetailsHelpText">{text}</p>
      {actionLabel ? (
        <button className="campaignDetailsGhostBtn" type="button" disabled>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
