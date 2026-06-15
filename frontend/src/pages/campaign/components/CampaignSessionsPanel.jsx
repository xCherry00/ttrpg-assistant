import { Link } from "react-router-dom";
import { useState } from "react";

function statusLabel(status) {
  if (status === "IN_PROGRESS") return "Trwa";
  if (status === "FINISHED") return "Zakończona";
  return "Zaplanowana";
}

export default function CampaignSessionsPanel({
  campaignId,
  sessions,
  title = "Sesje kampanii",
  isOwner,
  busy,
  onCreate,
  onStart,
  onFinish,
  onGetMySessionNote,
  onSaveMySessionNote,
  onDeleteMySessionNote,
}) {
  const [noteModal, setNoteModal] = useState({ open: false, session: null });
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteNotice, setNoteNotice] = useState("");

  async function openMyNotes(session) {
    setNoteModal({ open: true, session });
    setNoteForm({ title: "", content: "" });
    setNoteLoading(true);
    setNoteSaving(false);
    setNoteError("");
    setNoteNotice("");
    try {
      const note = await onGetMySessionNote?.(session.id);
      setNoteForm({ title: note?.title || "", content: note?.content || "" });
    } catch (err) {
      setNoteError(err?.message || "Nie udało się pobrać notatki.");
    } finally {
      setNoteLoading(false);
    }
  }

  function closeMyNotes() {
    setNoteModal({ open: false, session: null });
    setNoteError("");
    setNoteNotice("");
  }

  async function saveMyNotes() {
    if (!noteModal.session) return;
    setNoteSaving(true);
    setNoteError("");
    setNoteNotice("");
    try {
      await onSaveMySessionNote?.(noteModal.session.id, {
        title: noteForm.title,
        content: noteForm.content,
      });
      setNoteNotice("Zapisano notatkę.");
    } catch (err) {
      setNoteError(err?.message || "Nie udało się zapisać notatki.");
    } finally {
      setNoteSaving(false);
    }
  }

  async function deleteMyNotes() {
    if (!noteModal.session) return;
    setNoteSaving(true);
    setNoteError("");
    setNoteNotice("");
    try {
      await onDeleteMySessionNote?.(noteModal.session.id);
      setNoteForm({ title: "", content: "" });
      setNoteNotice("Usunięto notatkę.");
    } catch (err) {
      setNoteError(err?.message || "Nie udało się usunąć notatki.");
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <>
      <section className="campaignDetailsCard panel-soft">
        <h2 className="campaignDetailsCardTitle">{title}</h2>

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
            <label className="campaignField"><span>Tytuł</span><input name="title" required /></label>
            <label className="campaignField"><span>Opis</span><input name="description" /></label>
            <label className="campaignField"><span>Termin</span><input name="scheduledFor" type="datetime-local" /></label>
            <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy}>Utwórz sesję</button>
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
                  {session.status === "IN_PROGRESS" && (
                    <Link className="campaignDetailsGhostBtn" to={`/campaigns/${campaignId}/sessions/${session.id}/live`}>
                      Dołącz do aktywnej sesji
                    </Link>
                  )}
                  {session.status === "PLANNED" && (
                    <button className="campaignDetailsGhostBtn" type="button" disabled>
                      Sesja jeszcze nierozpoczęta
                    </button>
                  )}
                  {session.status === "FINISHED" && (
                    <>
                      <span className="campaignDetailsEmpty">Sesja zakończona (archiwalna).</span>
                      <button className="campaignDetailsGhostBtn" type="button" onClick={() => openMyNotes(session)}>
                        Moje notatki
                      </button>
                    </>
                  )}
                  {isOwner && session.status === "PLANNED" && (
                    <button className="campaignDetailsPrimaryBtn" type="button" disabled={busy} onClick={() => onStart(session.id)}>Rozpocznij</button>
                  )}
                  {isOwner && session.status === "IN_PROGRESS" && (
                    <button className="campaignDetailsDangerBtn" type="button" disabled={busy} onClick={() => onFinish(session.id)}>Zakończ</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {noteModal.open && (
        <div className="initiativeModalOverlay" role="dialog" aria-modal="true" aria-label="Moje notatki z sesji">
          <div className="initiativeModalWindow" style={{ maxWidth: 760 }}>
            <header className="initiativeModalHeader">
              <h2>Moje notatki z sesji</h2>
              <button className="initiativeModalCloseBtn" type="button" onClick={closeMyNotes}>
                Zamknij
              </button>
            </header>
            {noteLoading ? <p>Ładowanie notatki...</p> : null}
            {noteError ? <p className="campaignDetailsError">{noteError}</p> : null}
            {noteNotice ? <p className="campaignDetailsNotice">{noteNotice}</p> : null}
            {!noteLoading && (
              <div style={{ display: "grid", gap: 10 }}>
                <label className="campaignField">
                  <span>Tytuł notatki</span>
                  <input
                    value={noteForm.title}
                    maxLength={120}
                    onChange={(event) => setNoteForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label className="campaignField">
                  <span>Treść notatki</span>
                  <textarea
                    rows={8}
                    value={noteForm.content}
                    maxLength={10000}
                    onChange={(event) => setNoteForm((prev) => ({ ...prev, content: event.target.value }))}
                  />
                </label>
              </div>
            )}
            <footer className="initiativeModalFooter" style={{ marginTop: 12 }}>
              <button className="initiativeBtn initiativeBtn--ghost" type="button" onClick={closeMyNotes}>
                Zamknij
              </button>
              <button className="initiativeBtn initiativeBtn--ghost" type="button" onClick={deleteMyNotes} disabled={noteSaving || noteLoading}>
                Usuń notatkę
              </button>
              <button className="initiativeBtn initiativeBtn--primary" type="button" onClick={saveMyNotes} disabled={noteSaving || noteLoading}>
                {noteSaving ? "Zapisywanie..." : "Zapisz"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
