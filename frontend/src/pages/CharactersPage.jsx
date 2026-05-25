import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  deleteCharacter,
  exportCharacter,
  getCharacter,
  importCharacter,
  listCharacters,
  quickCreateCharacter,
  quickCreateCocCharacter,
  updateCharacterSheet,
} from "../api/characters";
import CharacterCreatorRouter from "../components/characters/CharacterCreatorRouter";
import CharacterSheetRouter from "../components/characters/CharacterSheetRouter";
import CharacterSystemSelector from "../components/characters/CharacterSystemSelector";
import CharacterSidebar from "../components/characters/CharacterSidebar";
import "../styles/characters.css";

export default function CharactersPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { characterId: routeCharacterId } = useParams();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedCreationSystem, setSelectedCreationSystem] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");
  const importInputRef = useRef(null);
  const readOnlyPreview = searchParams.get("mode") === "preview";

  const showNotice = useCallback((type, text) => {
    setNotice({ type, text });
  }, []);

  const loadList = useCallback(async ({ preserveSelection = false } = {}) => {
    setLoading(true);
    setError("");
    try {
      const data = await listCharacters(token);
      const next = Array.isArray(data) ? data : [];
      setItems(next);
      setSelectedId((prev) => {
        const routeId = Number(routeCharacterId);
        if (routeId && next.some((item) => item.id === routeId)) return routeId;
        if (preserveSelection && prev && next.some((item) => item.id === prev)) return prev;
        return prev ?? null;
      });
    } catch (err) {
      const message = err?.message || "Nie udalo sie pobrac postaci.";
      setError(message);
      showNotice("error", message);
    } finally {
      setLoading(false);
    }
  }, [routeCharacterId, token, showNotice]);

  useEffect(() => {
    loadList({ preserveSelection: true });
  }, [loadList]);

  useEffect(() => {
    const routeId = Number(routeCharacterId);
    if (routeId) {
      setSelectedId(routeId);
      return;
    }
    setSelectedId(null);
  }, [routeCharacterId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    getCharacter(token, selectedId)
      .then(setDetail)
      .catch((e) => {
        const message = e?.message || "Nie udalo sie pobrac karty.";
        setError(message);
        showNotice("error", message);
      })
      .finally(() => setDetailLoading(false));
  }, [token, selectedId, showNotice]);

  async function onCreate(payload) {
    setCreating(true);
    setError("");
    try {
      const created = await quickCreateCharacter(token, payload);
      setCreatorOpen(false);
      setSelectedCreationSystem(null);
      await loadList({ preserveSelection: true });
      navigate(`/characters/${created.id}`);
      showNotice("success", "Postac utworzona.");
    } catch (err) {
      const message = err?.message || "Nie udalo sie utworzyc postaci.";
      setError(message);
      showNotice("error", message);
    } finally {
      setCreating(false);
    }
  }

  async function onCreateCoc(payload) {
    setCreating(true);
    setError("");
    try {
      const created = await quickCreateCocCharacter(token, payload);
      setCreatorOpen(false);
      setSelectedCreationSystem(null);
      await loadList({ preserveSelection: true });
      navigate(`/characters/${created.id}`);
      showNotice("success", "Badacz utworzony.");
    } catch (err) {
      const message = err?.message || "Nie udalo sie utworzyc badacza.";
      setError(message);
      showNotice("error", message);
    } finally {
      setCreating(false);
    }
  }

  async function onSave(update) {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const saved = await updateCharacterSheet(token, selectedId, update);
      setDetail(saved);
      await loadList({ preserveSelection: true });
      showNotice("success", "Zmiany zapisane.");
    } catch (err) {
      const message = err?.message || "Nie udalo sie zapisac zmian.";
      setError(message);
      showNotice("error", message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedId) return;
    setDeleting(true);
    setError("");
    try {
      await deleteCharacter(token, selectedId);
      setDetail(null);
      setSelectedId(null);
      await loadList({ preserveSelection: true });
      navigate("/characters");
      setConfirmDeleteOpen(false);
      showNotice("success", "Postac usunieta.");
    } catch (err) {
      const message = err?.message || "Nie udalo sie usunac postaci.";
      setError(message);
      showNotice("error", message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportJson() {
    if (!selectedId) return;
    try {
      const payload = await exportCharacter(token, selectedId);
      const baseName = String(detail?.name || "character")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "character";
      const filename = `${baseName}-ttrpg-assistant.json`;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      showNotice("success", "Wyeksportowano postac do JSON.");
    } catch (err) {
      const message = err?.message || "Nie udalo sie wyeksportowac postaci.";
      setError(message);
      showNotice("error", message);
    }
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handlePrint() {
    if (!selectedId) return;
    window.print();
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const raw = await file.text();
      const payload = JSON.parse(raw);
      const imported = await importCharacter(token, payload);
      await loadList({ preserveSelection: true });
      if (imported?.characterId) {
        navigate(`/characters/${imported.characterId}`);
      }
      showNotice("success", "Postac zaimportowana.");
    } catch (err) {
      const message = err?.message || "Nie udalo sie zaimportowac postaci.";
      setError(message);
      showNotice("error", message);
    }
  }

  function openCreateFlow() {
    setError("");
    setSelectedCreationSystem(null);
    setCreatorOpen(true);
  }

  function closeCreateFlow() {
    setCreatorOpen(false);
    setSelectedCreationSystem(null);
  }

  function openCharacterSheet(characterId) {
    navigate(`/characters/${characterId}`);
  }

  function handleBackToList() {
    navigate("/characters");
  }

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <div className="page charactersPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">bohaterowie</span>
          <h1 className="pageTitle">Postacie</h1>
          <p className="pageSubtitle">Wybierz postac z listy albo utworz nowa, aby przejsc do widoku karty.</p>
        </div>
        <button type="button" className="charactersPrimaryBtn" onClick={openCreateFlow}>+ Nowa postac</button>
      </div>

      {notice && <div className={`charactersNotice${notice.type === "error" ? " is-error" : ""}`}>{notice.text}</div>}
      {error && <div className="charactersError">{error}</div>}
      {loading && <div className="charactersState">Ladowanie...</div>}

      {!loading && (
        <div className="charactersLayout">
          <CharacterSidebar
            items={items}
            loading={loading}
            selectedId={selectedId}
            onSelect={openCharacterSheet}
            onCreate={openCreateFlow}
            onImport={handleImportClick}
          />
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleImportFile}
          />

          <section className="charactersDetail">
            {creatorOpen && (
              <div className="charactersPanel charactersCreatePanel">
                <div className="charactersCreateHead">
                    <div>
                      <div className="charactersEyebrow">{selectedCreationSystem ? "Szybki kreator" : "Wybierz system"}</div>
                    <h2>{selectedCreationSystem === "dnd5e" ? "Nowa postac D&D 5e" : selectedCreationSystem === "coc7e" ? "Nowy badacz CoC 7e" : "Nowa postac"}</h2>
                    <p>{selectedCreationSystem ? "Wypelnij podstawowe dane i utworz startowa karte." : "Najpierw wybierz system gry. Potem pokazemy odpowiedni szybki kreator."}</p>
                  </div>
                  <button type="button" className="charactersGhostBtn" onClick={closeCreateFlow}>Zamknij</button>
                </div>
                {!selectedCreationSystem && <CharacterSystemSelector onSelect={setSelectedCreationSystem} />}
                {selectedCreationSystem && (
                  <>
                    {creating && <div className="charactersState">Tworzenie postaci...</div>}
                    <CharacterCreatorRouter
                      systemCode={selectedCreationSystem}
                      creating={creating}
                      onCreateDnd={onCreate}
                      onCreateCoc={onCreateCoc}
                      onBack={() => setSelectedCreationSystem(null)}
                    />
                  </>
                )}
              </div>
            )}

            {!creatorOpen && items.length === 0 && <div className="charactersEmpty">Nie masz jeszcze postaci. Uzyj przycisku + Nowa postac.</div>}
            {!creatorOpen && items.length > 0 && !selectedId && <div className="charactersEmpty">Wybierz postac z listy, aby otworzyc karte.</div>}
            {!creatorOpen && detailLoading && <div className="charactersState">Ladowanie karty...</div>}

            {!creatorOpen && detail && !detailLoading && (
              <>
                <div className="charactersActionBar">
                  <button type="button" className="charactersGhostBtn" onClick={handleBackToList}>Wroc do listy</button>
                  {!readOnlyPreview && <button type="button" className="charactersGhostBtn" onClick={handleExportJson}>Eksportuj JSON</button>}
                  <button type="button" className="charactersGhostBtn" onClick={handlePrint}>Drukuj</button>
                  {!readOnlyPreview && <button type="button" className="charactersDangerBtn" disabled={deleting} onClick={() => setConfirmDeleteOpen(true)}>Usun postac</button>}
                  {readOnlyPreview && <span className="charactersReadonlyBadge">Podglad MG - tryb tylko do odczytu</span>}
                </div>
                {saving && <div className="charactersState">Zapisywanie zmian...</div>}
                <CharacterSheetRouter detail={detail} onSave={onSave} saving={saving} readOnly={readOnlyPreview} />
                {!readOnlyPreview && confirmDeleteOpen && (
                  <div className="charactersConfirmBox">
                    <p>Czy na pewno chcesz usunac postac: <strong>{detail.name}</strong>?</p>
                    <div className="charactersActionsFooter">
                      <button type="button" className="charactersGhostBtn" disabled={deleting} onClick={() => setConfirmDeleteOpen(false)}>Anuluj</button>
                      <button type="button" className="charactersDangerBtn" disabled={deleting} onClick={onDelete}>{deleting ? "Usuwanie..." : "Potwierdz usuniecie"}</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
