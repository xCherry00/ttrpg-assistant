import { useEffect, useMemo, useState } from "react";
import ImageLibraryPicker from "../../../components/common/ImageLibraryPicker";

export default function CampaignOverviewPanel({ campaign, isOwner, busy, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    title: campaign?.title || "",
    description: campaign?.description || "",
    status: campaign?.status || "active",
    coverImageUrl: campaign?.coverImageUrl || "",
    playerLimit: campaign?.playerLimit || 5,
  });

  useEffect(() => {
    setForm({
      title: campaign?.title || "",
      description: campaign?.description || "",
      status: campaign?.status || "active",
      coverImageUrl: campaign?.coverImageUrl || "",
      playerLimit: campaign?.playerLimit || 5,
    });
  }, [campaign]);

  const dirty = useMemo(() => {
    return (
      form.title !== (campaign?.title || "") ||
      form.description !== (campaign?.description || "") ||
      form.status !== (campaign?.status || "active") ||
      form.coverImageUrl !== (campaign?.coverImageUrl || "") ||
      Number(form.playerLimit) !== Number(campaign?.playerLimit || 5)
    );
  }, [form, campaign]);

  function submit(event) {
    event.preventDefault();
    if (!dirty) return;
    onUpdate({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      coverImageUrl: form.coverImageUrl || null,
      playerLimit: Number(form.playerLimit) || 5,
    });
  }

  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Campaign Overview</h2>
      <div className="campaignDetailsInfoRow"><span>Nazwa</span><strong>{campaign?.title || "-"}</strong></div>
      <div className="campaignDetailsInfoRow"><span>Status</span><strong>{campaign?.status || "-"}</strong></div>
      <div className="campaignDetailsInfoRow"><span>System</span><strong>{campaign?.systemCode || "-"}</strong></div>
      {campaign?.inviteCode || campaign?.joinCode ? (
        <div className="campaignDetailsInfoRow"><span>Kod zaproszenia</span><strong>{campaign.inviteCode || campaign.joinCode}</strong></div>
      ) : null}
      <div className="campaignDetailsInfoRow"><span>Limit graczy</span><strong>{campaign?.playerLimit || 5}</strong></div>
      <p className="campaignDetailsHelpText">{campaign?.description || "Brak opisu kampanii."}</p>

      {isOwner && (
        <form onSubmit={submit} className="campaignFormCard" style={{ marginTop: 12 }}>
          <label className="campaignField">
            <span>Nazwa</span>
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
          </label>
          <label className="campaignField">
            <span>Opis</span>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>
          <label className="campaignField">
            <span>Status</span>
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="active">active</option>
              <option value="finished">finished</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="campaignField">
            <span>Limit graczy</span>
            <input
              type="number"
              min="1"
              max="20"
              value={form.playerLimit}
              onChange={(e) => setForm((prev) => ({ ...prev, playerLimit: e.target.value }))}
              required
            />
          </label>
          <ImageLibraryPicker
            type="campaignIcons"
            label="Ikona kampanii"
            value={form.coverImageUrl}
            onChange={(url) => setForm((prev) => ({ ...prev, coverImageUrl: url }))}
            onRemove={() => setForm((prev) => ({ ...prev, coverImageUrl: "" }))}
            previewAlt="Ikona kampanii"
            helpText="Wybierz gotową ikonę kampanii z biblioteki."
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy || !dirty}>Zapisz</button>
            <button className="campaignDetailsDangerBtn" type="button" disabled={busy} onClick={onDelete}>Usuń (soft-delete)</button>
          </div>
        </form>
      )}
    </section>
  );
}
