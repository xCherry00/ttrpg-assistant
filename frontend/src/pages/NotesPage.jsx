import { useCallback, useEffect, useMemo, useState } from "react";
import { listCampaigns } from "../api/campaigns";
import { listCharacters } from "../api/characters";
import { createNote, deleteNote, listNotes, updateNote } from "../api/notes";
import { useAuth } from "../auth/AuthContext";
import AppToast from "../components/common/AppToast";

const NOTE_TYPES = [
  { value: "SESSION", label: "Notatka z sesji" },
  { value: "NPC", label: "NPC" },
  { value: "ITEM", label: "Przedmiot" },
  { value: "LORE", label: "Wiedza o świecie" },
  { value: "QUEST", label: "Wątek / zadanie" },
  { value: "OTHER", label: "Inne" },
];

const EMPTY_FORM = {
  title: "",
  type: "SESSION",
  campaignId: "",
  characterId: "",
  content: "",
};

function noteTypeLabel(type) {
  return NOTE_TYPES.find((item) => item.value === type)?.label || "Inne";
}

function entityName(row, fallback = "Bez nazwy") {
  return row?.title || row?.name || row?.displayName || fallback;
}

function formatDate(value) {
  if (!value) return "Brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toId(value) {
  return value ? Number(value) : null;
}

export default function NotesPage() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    type: "ALL",
    assignment: "ALL",
    sort: "updated",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [noteRows, campaignRows, characterRows] = await Promise.all([
        listNotes(token),
        listCampaigns(token),
        listCharacters(token),
      ]);
      setNotes(Array.isArray(noteRows) ? noteRows : []);
      setCampaigns(Array.isArray(campaignRows) ? campaignRows : []);
      setCharacters(Array.isArray(characterRows) ? characterRows : []);
    } catch (err) {
      setError(err?.message || "Nie udało się pobrać notatek.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function openCreateModal() {
    setEditingNote(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setError("");
    setModalOpen(true);
  }

  function openEditModal(note) {
    setEditingNote(note);
    setForm({
      title: note.title || "",
      type: note.type || "SESSION",
      campaignId: note.campaignId ? String(note.campaignId) : "",
      characterId: note.characterId ? String(note.characterId) : "",
      content: note.content || "",
    });
    setFormErrors({});
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingNote(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      type: form.type,
      content: form.content,
      campaignId: toId(form.campaignId),
      characterId: toId(form.characterId),
    };

    if (!payload.title) {
      setFormErrors({ title: "Podaj nazwę notatki." });
      setError("");
      return;
    }

    setSaving(true);
    setError("");
    setFormErrors({});
    try {
      const saved = editingNote
        ? await updateNote(token, editingNote.id, payload)
        : await createNote(token, payload);
      setNotes((current) => {
        const withoutSaved = current.filter((note) => note.id !== saved.id);
        return [saved, ...withoutSaved];
      });
      setModalOpen(false);
      setEditingNote(null);
      setForm(EMPTY_FORM);
      setFormErrors({});
    } catch (err) {
      setError(err?.message || "Nie udało się zapisać notatki.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingNote || saving) return;
    setSaving(true);
    setError("");
    try {
      await deleteNote(token, editingNote.id);
      setNotes((current) => current.filter((note) => note.id !== editingNote.id));
      setModalOpen(false);
      setEditingNote(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err?.message || "Nie udało się usunąć notatki.");
    } finally {
      setSaving(false);
    }
  }

  const filteredNotes = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return notes
      .filter((note) => {
        if (filters.type !== "ALL" && note.type !== filters.type) return false;
        if (filters.assignment === "CAMPAIGN" && !note.campaignId) return false;
        if (filters.assignment === "CHARACTER" && !note.characterId) return false;
        if (filters.assignment === "UNASSIGNED" && (note.campaignId || note.characterId)) return false;
        if (!query) return true;
        return [note.title, note.content, note.campaignName, note.characterName, noteTypeLabel(note.type)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((left, right) => {
        if (filters.sort === "title") return String(left.title || "").localeCompare(String(right.title || ""), "pl");
        return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
      });
  }, [filters, notes]);

  return (
    <div className="page notesPage">
      <section className="notesToolbar">
        <label className="notesSearch">
          <span>Szukaj</span>
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Szukaj po tytule, treści lub przypisaniu..."
          />
        </label>
        <label>
          <span>Typ</span>
          <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
            <option value="ALL">Wszystkie typy</option>
            {NOTE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label>
          <span>Przypisanie</span>
          <select value={filters.assignment} onChange={(event) => updateFilter("assignment", event.target.value)}>
            <option value="ALL">Wszystkie</option>
            <option value="CAMPAIGN">Do kampanii</option>
            <option value="CHARACTER">Do postaci</option>
            <option value="UNASSIGNED">Bez przypisania</option>
          </select>
        </label>
        <label>
          <span>Sortowanie</span>
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
            <option value="updated">Ostatnia zmiana</option>
            <option value="title">Nazwa A-Z</option>
          </select>
        </label>
        <button type="button" className="notesPrimaryButton notesToolbarAction" onClick={openCreateModal}>
          + Nowa notatka
        </button>
      </section>

      <section className="notesListPanel">
        <div className="notesPanelHeader">
          <div>
            <h2>Lista notatek</h2>
            <p>{filteredNotes.length} pozycji</p>
          </div>
        </div>

        {loading && <div className="notesEmpty">Ładowanie notatek...</div>}
        {!loading && filteredNotes.length === 0 && (
          <div className="notesEmpty">
            <strong>Brak notatek</strong>
            <span>Utwórz pierwszą notatkę albo zmień filtry.</span>
          </div>
        )}
        {!loading && filteredNotes.length > 0 && (
          <div className="notesList">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className="notesListItem"
                onClick={() => openEditModal(note)}
              >
                <span className="notesListItem__type">{noteTypeLabel(note.type)}</span>
                <strong>{note.title}</strong>
                <small>
                  {note.campaignName || note.characterName
                    ? [note.campaignName, note.characterName].filter(Boolean).join(" • ")
                    : "Bez przypisania"}
                </small>
                <em>Ostatnio: {formatDate(note.updatedAt || note.createdAt)}</em>
              </button>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <NoteModal
          form={form}
          editingNote={editingNote}
          errors={formErrors}
          campaigns={campaigns}
          characters={characters}
          saving={saving}
          onClose={closeModal}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
        />
      )}

      {error && <AppToast message={error} onClose={() => setError("")} />}
    </div>
  );
}

function NoteModal({ form, editingNote, errors = {}, campaigns, characters, saving, onClose, onDelete, onSubmit, onUpdate }) {
  return (
    <div className="notesModalOverlay" role="presentation" onMouseDown={onClose}>
      <section className="notesModal" role="dialog" aria-modal="true" aria-labelledby="notesModalTitle" onMouseDown={(event) => event.stopPropagation()}>
        <header className="notesModalHeader">
          <div>
            <h2 id="notesModalTitle">{editingNote ? "Edytuj notatkę" : "Nowa notatka"}</h2>
            <p>{editingNote ? "Zmieniaj treść i przypisania tej notatki." : "Zapisz nowy wpis w swoim notesie."}</p>
          </div>
          <button type="button" className="notesModalClose" aria-label="Zamknij okno" onClick={onClose} disabled={saving}>
            ×
          </button>
        </header>

        <form className="notesForm" onSubmit={onSubmit}>
          <label className={`notesField notesField--title${errors.title ? " is-invalid" : ""}`}>
            <span>Nazwa notatki *</span>
            <input
              value={form.title}
              onChange={(event) => onUpdate("title", event.target.value)}
              maxLength={120}
              placeholder="Np. Tajemnica ruin pod miastem"
              aria-invalid={errors.title ? "true" : "false"}
              aria-describedby={errors.title ? "note-title-error" : undefined}
              autoFocus
            />
            {errors.title ? (
              <small id="note-title-error" className="notesFieldError" role="alert">
                {errors.title}
              </small>
            ) : null}
          </label>

          <div className="notesFormGrid">
            <label className="notesField">
              <span>Typ notatki</span>
              <select value={form.type} onChange={(event) => onUpdate("type", event.target.value)}>
                {NOTE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label className="notesField">
              <span>Kampania</span>
              <select value={form.campaignId} onChange={(event) => onUpdate("campaignId", event.target.value)}>
                <option value="">Brak kampanii</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{entityName(campaign)}</option>
                ))}
              </select>
            </label>
            <label className="notesField">
              <span>Postać</span>
              <select value={form.characterId} onChange={(event) => onUpdate("characterId", event.target.value)}>
                <option value="">Brak postaci</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>{entityName(character)}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="notesField notesField--content">
            <span>Treść notatki</span>
            <textarea
              value={form.content}
              onChange={(event) => onUpdate("content", event.target.value)}
              maxLength={12000}
              placeholder="Zapisz przebieg sesji, tropy, informacje o NPC, przedmiotach albo luźne pomysły..."
            />
          </label>

          <footer className="notesFormActions">
            {editingNote && (
              <button type="button" className="notesDangerButton" onClick={onDelete} disabled={saving}>
                Usuń
              </button>
            )}
            <button type="button" className="notesGhostButton" onClick={onClose} disabled={saving}>
              Anuluj
            </button>
            <button type="submit" className="notesPrimaryButton" disabled={saving}>
              {saving ? "Zapisywanie..." : editingNote ? "Zapisz zmiany" : "Utwórz notatkę"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
