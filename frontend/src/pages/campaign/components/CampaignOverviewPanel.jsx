import { useEffect, useMemo, useState } from "react";
import ImageUpload from "../../../components/common/ImageUpload";

export default function CampaignOverviewPanel({ campaign, isOwner, busy, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    title: campaign?.title || "",
    description: campaign?.description || "",
    status: campaign?.status || "active",
    coverImageUrl: campaign?.coverImageUrl || "",
  });

  useEffect(() => {
    setForm({
      title: campaign?.title || "",
      description: campaign?.description || "",
      status: campaign?.status || "active",
      coverImageUrl: campaign?.coverImageUrl || "",
    });
  }, [campaign]);

  const dirty = useMemo(() => {
    return (
      form.title !== (campaign?.title || "") ||
      form.description !== (campaign?.description || "") ||
      form.status !== (campaign?.status || "active") ||
      form.coverImageUrl !== (campaign?.coverImageUrl || "")
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
    });
  }

  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Campaign Overview</h2>
      <div className="campaignDetailsInfoRow"><span>Nazwa</span><strong>{campaign?.title || "-"}</strong></div>
      <div className="campaignDetailsInfoRow"><span>Status</span><strong>{campaign?.status || "-"}</strong></div>
      <div className="campaignDetailsInfoRow"><span>System</span><strong>{campaign?.systemCode || "-"}</strong></div>
      <div className="campaignDetailsInfoRow"><span>Join code</span><strong>{isOwner ? (campaign?.inviteCode || "-") : "Dostepny tylko dla MG"}</strong></div>
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
          <ImageUpload
            label="Okładka kampanii"
            value={form.coverImageUrl}
            onChange={(url) => setForm((prev) => ({ ...prev, coverImageUrl: url }))}
            onRemove={() => setForm((prev) => ({ ...prev, coverImageUrl: "" }))}
            previewAlt="Okładka kampanii"
          />
          <label className="campaignField">
            <span>URL okładki (opcjonalnie)</span>
            <input value={form.coverImageUrl} onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy || !dirty}>Zapisz</button>
            <button className="campaignDetailsDangerBtn" type="button" disabled={busy} onClick={onDelete}>Usun (soft-delete)</button>
          </div>
        </form>
      )}
    </section>
  );
}
