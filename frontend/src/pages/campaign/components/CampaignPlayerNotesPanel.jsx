import { useState } from "react";

export default function CampaignPlayerNotesPanel({ notes, campaign, busy, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const canSeeAuthor = Boolean(campaign?.owner);
  const empty = !notes || notes.length === 0;
  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Notatki graczy</h2>

      <form
        className="campaignFormCard"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const title = String(formData.get("title") || "").trim();
          const content = String(formData.get("content") || "").trim();
          if (!title || !content) return;
          onCreate({ title, content });
          event.currentTarget.reset();
        }}
      >
        <label className="campaignField"><span>Tytul</span><input aria-label="Tytul" name="title" maxLength={160} required /></label>
        <label className="campaignField"><span>Tresc</span><textarea aria-label="Tresc" name="content" rows={3} maxLength={10000} required /></label>
        <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy}>Dodaj notatke</button>
      </form>

      {empty ? (
        <div className="campaignDetailsEmpty">Brak notatek.</div>
      ) : (
        <div className="campaignMaterialList">
          {notes.map((note) => {
            const isEditing = editingId === note.id;
            return (
              <article key={note.id} className="campaignMaterialCard">
                {isEditing ? (
                  <form
                    className="campaignFormCard"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      onUpdate(note.id, {
                        title: String(formData.get("title") || "").trim(),
                        content: String(formData.get("content") || "").trim(),
                      });
                      setEditingId(null);
                    }}
                  >
                    <label className="campaignField"><span>Tytul</span><input aria-label="Tytul" name="title" defaultValue={note.title} maxLength={160} required /></label>
                    <label className="campaignField"><span>Tresc</span><textarea aria-label="Tresc" name="content" defaultValue={note.content} rows={4} maxLength={10000} required /></label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy}>Zapisz</button>
                      <button className="campaignDetailsGhostBtn" type="button" onClick={() => setEditingId(null)}>Anuluj</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="campaignMaterialCard__top">
                      <strong>{note.title}</strong>
                      <span className="campaignMemberBadge">{new Date(note.updatedAt).toLocaleString("pl-PL")}</span>
                    </div>
                    <p>{note.content.slice(0, 260)}{note.content.length > 260 ? "..." : ""}</p>
                    {canSeeAuthor && <p>Autor: {note.displayName || note.username}</p>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="campaignDetailsGhostBtn" type="button" disabled={busy} onClick={() => setEditingId(note.id)}>Edytuj</button>
                      <button className="campaignDetailsDangerBtn" type="button" disabled={busy} onClick={() => onDelete(note.id)}>Usun</button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
