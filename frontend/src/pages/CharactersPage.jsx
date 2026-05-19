import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  deleteCharacter,
  getCharacter,
  listCharacters,
  quickCreateCharacter,
  updateCharacterSheet,
} from "../api/characters";
import QuickCharacterCreator from "../components/QuickCharacterCreator";
import CharacterSheetView from "../components/CharacterSheetView";
import "../styles/characters.css";

export default function CharactersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [createSystem, setCreateSystem] = useState(null);
  const [error, setError] = useState("");

  const systems = [
    {
      code: "dnd5e",
      name: "D&D 5e",
      status: "Gotowe",
      description: "Szybki kreator poziomu 1 z danymi z kompendium i lokalnymi fallbackami.",
      enabled: true,
    },
    {
      code: "generic",
      name: "Uniwersalny TTRPG",
      status: "Wkrotce",
      description: "Prosty szkic postaci bez zasad konkretnego systemu.",
      enabled: false,
    },
  ];

  async function loadList() {
    setLoading(true);
    setError("");
    try {
      const data = await listCharacters(token);
      const next = Array.isArray(data) ? data : [];
      setItems(next);
      setSelectedId((prev) => prev ?? next[0]?.id ?? null);
    } catch (err) {
      setError(err?.message || "Nie udalo sie pobrac postaci.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, [token]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    getCharacter(token, selectedId)
      .then(setDetail)
      .catch((e) => setError(e?.message || "Nie udalo sie pobrac karty."))
      .finally(() => setDetailLoading(false));
  }, [token, selectedId]);

  async function onCreate(payload) {
    setCreating(true);
    setError("");
    try {
      const created = await quickCreateCharacter(token, payload);
      setModalOpen(false);
      await loadList();
      setSelectedId(created.id);
    } catch (err) {
      setError(err?.message || "Nie udalo sie utworzyc postaci.");
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
      await loadList();
    } catch (err) {
      setError(err?.message || "Nie udalo sie zapisac zmian.");
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
      await loadList();
    } catch (err) {
      setError(err?.message || "Nie udalo sie usunac postaci.");
    } finally {
      setDeleting(false);
    }
  }

  function openCreateFlow() {
    setError("");
    setCreateSystem(null);
    setModalOpen(true);
  }

  function closeCreateFlow() {
    setModalOpen(false);
    setCreateSystem(null);
  }

  return (
    <div className="page charactersPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">bohaterowie</span>
          <h1 className="pageTitle">Postacie</h1>
          <p className="pageSubtitle">MVP quick creator D&D 5e.</p>
        </div>
        <button type="button" className="charactersPrimaryBtn" onClick={openCreateFlow}>+ Nowa postac</button>
      </div>

      {error && <div className="charactersError">{error}</div>}
      {loading && <div className="charactersState">Ladowanie...</div>}

      {!loading && (
        <div className="charactersLayout">
          <section className="charactersSidebar">
            <div className="charactersSidebarTop"><h2>Moje postacie</h2><span>{items.length}</span></div>
            {items.map((item) => (
              <button key={item.id} type="button" className={`charactersCard${item.id === selectedId ? " is-active" : ""}`} onClick={() => setSelectedId(item.id)}>
                <div className="charactersCardTop">
                  <div>
                    <strong>{item.name}</strong>
                    <div>{item.raceName} / {item.className}</div>
                  </div>
                </div>
                <div className="charactersCardMeta"><span>Poziom {item.level}</span></div>
              </button>
            ))}
          </section>

          <section className="charactersDetail">
            {modalOpen && (
              <div className="charactersPanel charactersCreatePanel">
                <div className="charactersCreateHead">
                  <div>
                    <div className="charactersEyebrow">{createSystem ? "Szybki kreator" : "Wybierz system"}</div>
                    <h2>{createSystem === "dnd5e" ? "Nowa postac D&D 5e" : "Nowa postac"}</h2>
                    <p>{createSystem === "dnd5e" ? "Wybierz podstawowe dane, portret i utworz startowa karte." : "Najpierw wybierz system gry. Potem pokazemy odpowiedni szybki kreator."}</p>
                  </div>
                  <button type="button" className="charactersGhostBtn" onClick={closeCreateFlow}>Zamknij</button>
                </div>
                {!createSystem && (
                  <div className="charactersSystemGrid">
                    {systems.map((system) => (
                      <button key={system.code} type="button" className="charactersSystemCard" disabled={!system.enabled} onClick={() => setCreateSystem(system.code)}>
                        <span>{system.status}</span>
                        <strong>{system.name}</strong>
                        <p>{system.description}</p>
                      </button>
                    ))}
                  </div>
                )}
                {createSystem === "dnd5e" && (
                  <QuickCharacterCreator onCreate={onCreate} creating={creating} onBack={() => setCreateSystem(null)} />
                )}
              </div>
            )}
            {!modalOpen && !selectedId && <div className="charactersEmpty">Wybierz postac z listy albo utworz nowa.</div>}
            {!modalOpen && detailLoading && <div className="charactersState">Ladowanie karty...</div>}
            {!modalOpen && detail && !detailLoading && (
              <>
                <CharacterSheetView detail={detail} onSave={onSave} saving={saving} />
                <div className="charactersActionsFooter">
                  <button type="button" className="charactersDangerBtn" disabled={deleting} onClick={onDelete}>{deleting ? "Usuwanie..." : "Usun postac"}</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

