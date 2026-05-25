import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getDndMonsterDetails, searchDndMonsters } from "../../api/initiative";
import "../../styles/initiative.css";

const STORAGE_KEY = "ttrpg.quickInitiativeTracker";
const LOOKUP_ERROR_MESSAGE = "Nie udalo sie pobrac danych z bazy D&D. Mozesz dodac uczestnika recznie.";
const SYSTEM_DND = "dnd5e";
const SYSTEM_COC = "coc7e";

const TYPE_OPTIONS = [
  { value: "PLAYER", label: "Gracz", color: "#2f78ff" },
  { value: "ENEMY", label: "Wrog", color: "#e5484d" },
  { value: "FRIENDLY", label: "Przyjazny", color: "#22a45d" },
  { value: "NPC", label: "NPC", color: "#757a86" },
];

const EMPTY_CUSTOM_FORM = {
  name: "",
  type: "ENEMY",
  color: "#e5484d",
  initiativeModifier: "0",
  initiative: "",
  dex: "",
  ac: "",
  hp: "",
  maxHp: "",
};

function colorForType(type) {
  return TYPE_OPTIONS.find((item) => item.value === type)?.color || "#757a86";
}

function typeLabel(type) {
  return TYPE_OPTIONS.find((item) => item.value === type)?.label || "NPC";
}

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
}

function sanitizeParticipant(raw, idx) {
  const type = raw.type || "ENEMY";
  return {
    id: raw.id || `p-${idx}`,
    name: String(raw.name || "").trim(),
    initiative: toOptionalNumber(raw.initiative),
    initiativeModifier: toOptionalNumber(raw.initiativeModifier) ?? 0,
    dex: toOptionalNumber(raw.dex),
    ac: toOptionalNumber(raw.ac),
    hp: toOptionalNumber(raw.hp),
    maxHp: toOptionalNumber(raw.maxHp),
    type,
    color: raw.color || colorForType(type),
    note: String(raw.note || ""),
    defeated: Boolean(raw.defeated),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : idx + 1,
    sourceType: raw.sourceType || "CUSTOM",
    sourceIndex: raw.sourceIndex || null,
    sourceName: raw.sourceName || null,
  };
}

function byOrder(list) {
  return [...list].sort((a, b) => a.order - b.order);
}

function byInitiative(list) {
  return [...list].sort((a, b) => {
    const ai = a.initiative ?? Number.NEGATIVE_INFINITY;
    const bi = b.initiative ?? Number.NEGATIVE_INFINITY;
    if (bi !== ai) return bi - ai;
    return a.order - b.order;
  });
}

function byDex(list) {
  return [...list].sort((a, b) => {
    const ad = a.dex ?? Number.NEGATIVE_INFINITY;
    const bd = b.dex ?? Number.NEGATIVE_INFINITY;
    if (bd !== ad) return bd - ad;
    return a.order - b.order;
  });
}

function reindexOrder(list) {
  return list.map((item, index) => ({ ...item, order: index + 1 }));
}

function createInitialState() {
  const fallback = {
    systemCode: SYSTEM_DND,
    participants: [],
    started: false,
    round: 1,
    activeParticipantId: null,
    orderCounter: 1,
    initiativeRolled: false,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const participants = Array.isArray(parsed.participants) ? parsed.participants.map(sanitizeParticipant) : [];
    const ordered = byOrder(participants);
    const fromLegacyIndex = Number.isInteger(parsed.currentTurnIndex) && ordered[parsed.currentTurnIndex]
      ? ordered[parsed.currentTurnIndex].id
      : null;
    return {
      systemCode: parsed.systemCode === SYSTEM_COC ? SYSTEM_COC : SYSTEM_DND,
      participants: ordered,
      started: Boolean(parsed.started),
      round: Number.isFinite(Number(parsed.round)) ? Math.max(1, Number(parsed.round)) : 1,
      activeParticipantId: parsed.activeParticipantId || fromLegacyIndex || null,
      orderCounter: Number.isFinite(Number(parsed.orderCounter)) ? Number(parsed.orderCounter) : ordered.length + 1,
      initiativeRolled: Boolean(parsed.initiativeRolled),
    };
  } catch {
    return fallback;
  }
}

export default function InitiativePage() {
  const { token } = useAuth();
  const [state, setState] = useState(createInitialState);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM_FORM);
  const [monsterResults, setMonsterResults] = useState([]);
  const [monsterLoading, setMonsterLoading] = useState(false);
  const [selectedMonsterIndex, setSelectedMonsterIndex] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const isDndMode = state.systemCode === SYSTEM_DND;
  const orderedParticipants = useMemo(() => byOrder(state.participants), [state.participants]);
  const activeParticipant = orderedParticipants.find((item) => item.id === state.activeParticipantId) || null;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore localStorage failures
    }
  }, [state]);

  function addParticipant(partial) {
    const hp = partial.hp ?? null;
    setState((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: partial.name,
          initiative: partial.initiative ?? null,
          initiativeModifier: partial.initiativeModifier ?? 0,
          dex: partial.dex ?? null,
          ac: partial.ac ?? null,
          hp,
          maxHp: partial.maxHp ?? null,
          type: partial.type || "ENEMY",
          color: partial.color || colorForType(partial.type || "ENEMY"),
          note: partial.note || "",
          defeated: hp !== null ? hp <= 0 : Boolean(partial.defeated),
          order: prev.orderCounter,
          sourceType: partial.sourceType || "CUSTOM",
          sourceIndex: partial.sourceIndex || null,
          sourceName: partial.sourceName || null,
        },
      ],
      orderCounter: prev.orderCounter + 1,
    }));
  }

  async function loadMonsters() {
    if (!isDndMode) return;
    setMonsterLoading(true);
    setError("");
    try {
      const results = await searchDndMonsters(token, "");
      setMonsterResults(Array.isArray(results) ? results : []);
    } catch {
      setMonsterResults([]);
      setError(LOOKUP_ERROR_MESSAGE);
    } finally {
      setMonsterLoading(false);
    }
  }

  useEffect(() => {
    if (isAddModalOpen && isDndMode && monsterResults.length === 0) {
      void loadMonsters();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddModalOpen, isDndMode]);

  async function handleSelectMonster(index) {
    if (!index || !isDndMode) return;
    setSelectedMonsterIndex(index);
    setError("");
    try {
      const details = await getDndMonsterDetails(token, index);
      if (!details) return;
      setCustomForm((prev) => ({
        ...prev,
        name: details.name || prev.name,
        type: "ENEMY",
        color: colorForType("ENEMY"),
        initiativeModifier: String(details.initiativeModifier ?? 0),
        dex: details.dexterity == null ? "" : String(details.dexterity),
        ac: details.armorClass == null ? "" : String(details.armorClass),
        hp: details.hitPoints == null ? "" : String(details.hitPoints),
        maxHp: details.hitPoints == null ? "" : String(details.hitPoints),
      }));
    } catch {
      setError(LOOKUP_ERROR_MESSAGE);
    }
  }

  function handleAddCustomParticipant(event) {
    event.preventDefault();
    setError("");
    const name = customForm.name.trim();
    if (!name) {
      setError("Nazwa uczestnika jest wymagana.");
      return;
    }
    const initiative = toOptionalNumber(customForm.initiative);
    const hp = toOptionalNumber(customForm.hp);
    let maxHp = toOptionalNumber(customForm.maxHp);
    if (hp !== null && maxHp === null) maxHp = hp;
    addParticipant({
      name,
      type: customForm.type,
      color: customForm.color,
      initiativeModifier: toOptionalNumber(customForm.initiativeModifier) ?? 0,
      initiative,
      dex: toOptionalNumber(customForm.dex),
      ac: toOptionalNumber(customForm.ac),
      hp,
      maxHp,
      sourceType: selectedMonsterIndex ? "DND_MONSTER" : "CUSTOM",
      sourceIndex: selectedMonsterIndex || null,
      sourceName: selectedMonsterIndex ? name : null,
    });
    setCustomForm((prev) => ({ ...EMPTY_CUSTOM_FORM, type: prev.type, color: colorForType(prev.type) }));
    setSelectedMonsterIndex("");
    setAddModalOpen(false);
  }

  function startCombat() {
    setState((prev) => {
      const sorted = reindexOrder(isDndMode ? byInitiative(prev.participants) : byDex(prev.participants));
      const firstActive = sorted.find((item) => !item.defeated) || null;
      return {
        ...prev,
        participants: sorted,
        started: true,
        round: 1,
        activeParticipantId: firstActive ? firstActive.id : null,
      };
    });
  }

  function rollInitiative() {
    if (!isDndMode) return;
    setState((prev) => {
      const rolled = prev.participants.map((item) => ({
        ...item,
        initiative: Math.floor(Math.random() * 20) + 1 + (item.initiativeModifier || 0),
      }));
      const sorted = reindexOrder(byInitiative(rolled));
      const firstActive = sorted.find((item) => !item.defeated) || null;
      return {
        ...prev,
        participants: sorted,
        started: true,
        initiativeRolled: true,
        round: 1,
        activeParticipantId: firstActive ? firstActive.id : null,
      };
    });
    setNotice("Inicjatywa zostala wylosowana dla tej walki.");
  }

  function sortBySystemAction() {
    setState((prev) => {
      const sorted = reindexOrder(isDndMode ? byInitiative(prev.participants) : byDex(prev.participants));
      const activeId = prev.activeParticipantId;
      const hasActive = sorted.some((item) => item.id === activeId);
      return { ...prev, participants: sorted, activeParticipantId: hasActive ? activeId : sorted[0]?.id || null };
    });
  }

  function moveTurn(direction) {
    setState((prev) => {
      const queue = byOrder(prev.participants).filter((item) => !item.defeated);
      if (!queue.length) return { ...prev, started: true, activeParticipantId: null };
      const currentIndex = queue.findIndex((item) => item.id === prev.activeParticipantId);
      if (currentIndex < 0) return { ...prev, started: true, activeParticipantId: queue[0].id };
      if (direction === "next") {
        const nextIndex = (currentIndex + 1) % queue.length;
        return { ...prev, started: true, activeParticipantId: queue[nextIndex].id, round: nextIndex <= currentIndex ? prev.round + 1 : prev.round };
      }
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      return { ...prev, started: true, activeParticipantId: queue[prevIndex].id, round: prevIndex >= currentIndex ? Math.max(1, prev.round - 1) : prev.round };
    });
  }

  function resetTurns() {
    setState((prev) => ({ ...prev, started: false, round: 1, activeParticipantId: prev.participants[0]?.id || null }));
  }

  function endCombat() {
    setState((prev) => ({ ...prev, started: false, initiativeRolled: false, round: 1, activeParticipantId: byOrder(prev.participants)[0]?.id || null }));
  }

  function clearAll() {
    setState((prev) => ({
      ...prev,
      participants: [],
      started: false,
      round: 1,
      activeParticipantId: null,
      orderCounter: 1,
      initiativeRolled: false,
    }));
    setDraggedId(null);
    setDragOverId(null);
    setNotice("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function patchParticipant(id, patchFn) {
    setState((prev) => ({ ...prev, participants: prev.participants.map((item) => (item.id === id ? patchFn(item) : item)) }));
  }

  function removeParticipant(id) {
    setState((prev) => {
      const next = prev.participants.filter((item) => item.id !== id);
      const reindexed = reindexOrder(byOrder(next));
      const hasActive = reindexed.some((item) => item.id === prev.activeParticipantId);
      return { ...prev, participants: reindexed, activeParticipantId: hasActive ? prev.activeParticipantId : reindexed[0]?.id || null };
    });
  }

  function handleDrop(targetId) {
    if (!draggedId || draggedId === targetId) return;
    setState((prev) => {
      const ordered = byOrder(prev.participants);
      const from = ordered.findIndex((item) => item.id === draggedId);
      const to = ordered.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return prev;
      const moved = [...ordered];
      const [row] = moved.splice(from, 1);
      moved.splice(to, 0, row);
      return { ...prev, participants: reindexOrder(moved) };
    });
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleSystemChange(nextSystemCode) {
    setState((prev) => ({
      ...prev,
      systemCode: nextSystemCode,
      started: false,
      initiativeRolled: false,
      round: 1,
      activeParticipantId: byOrder(prev.participants)[0]?.id || null,
    }));
    setNotice("");
  }

  return (
    <div className="page page--wide initiativePage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">Combat</span>
          <h1 className="pageTitle">{isDndMode ? "Inicjatywa D&D" : "Inicjatywa Zew Cthulhu"}</h1>
          <p className="pageSubtitle">{isDndMode ? "Szybki tracker walki D&D bez przypisywania do kampanii." : "Szybki tracker kolejnosci dla Zewu Cthulhu bez przypisywania do kampanii."}</p>
        </div>
      </div>

      <section className="card initiativeControlsCard">
        <div className="initiativeControlsSummary">
          <p>Runda: <strong>{state.round}</strong></p>
          <p>Aktywna tura: <strong>{activeParticipant ? activeParticipant.name : "Brak"}</strong></p>
        </div>
        <div className="initiativeActions">
          <label>
            System
            <select aria-label="System trackera" value={state.systemCode} onChange={(e) => handleSystemChange(e.target.value)}>
              <option value={SYSTEM_DND}>D&D 5e</option>
              <option value={SYSTEM_COC}>Zew Cthulhu 7e</option>
            </select>
          </label>
          <button className="btn btn-primary" type="button" onClick={() => setAddModalOpen(true)}>Dodaj uczestnika</button>
          <button className="btn btn-primary" type="button" onClick={startCombat}>Start walki</button>
          {isDndMode ? (
            <button className="btn" type="button" onClick={rollInitiative} disabled={state.initiativeRolled || state.participants.length === 0}>Losuj inicjatywe</button>
          ) : null}
          <button className="btn" type="button" onClick={sortBySystemAction}>{isDndMode ? "Sortuj po inicjatywie" : "Sortuj po ZR"}</button>
          <button className="btn" type="button" onClick={() => moveTurn("next")}>Nastepna tura</button>
          <button className="btn" type="button" onClick={() => moveTurn("prev")}>Poprzednia tura</button>
          <button className="btn" type="button" onClick={resetTurns}>Reset tur</button>
          <button className="btn" type="button" onClick={endCombat}>Zakoncz walke</button>
          <button className="btn" type="button" onClick={clearAll}>Wyczysc wszystko</button>
        </div>
        {notice && <p className="initiativeNotice">{notice}</p>}
      </section>

      {error && <div className="campaignDetailsError">{error}</div>}

      <section className="card">
        <h2>Uczestnicy walki</h2>
        {orderedParticipants.length === 0 ? (
          <p className="emptyText">Brak uczestnikow. Dodaj pierwsza postac lub przeciwnika.</p>
        ) : (
          <div className="initiativeTableWrap">
            <table className="initiativeTable">
              <thead>
                <tr>
                  <th>Typ / marker</th><th>Nazwa</th><th>{isDndMode ? "Inicjatywa" : "ZR / DEX"}</th>{isDndMode ? <th>AC</th> : null}<th>HP</th><th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {orderedParticipants.map((participant) => {
                  const isActive = state.started && state.activeParticipantId === participant.id && !participant.defeated;
                  return (
                    <tr
                      key={participant.id}
                      className={`${isActive ? "is-active" : ""} ${participant.defeated ? "is-defeated" : ""} ${dragOverId === participant.id ? "is-drag-over" : ""}`.trim()}
                      draggable
                      onDragStart={() => setDraggedId(participant.id)}
                      onDragOver={(event) => { event.preventDefault(); setDragOverId(participant.id); }}
                      onDrop={() => handleDrop(participant.id)}
                      onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                    >
                      <td><span className="initiativeColorDot" style={{ backgroundColor: participant.color || colorForType(participant.type) }} /> {typeLabel(participant.type)}</td>
                      <td><strong>{participant.name}</strong>{isActive && <span className="initiativeBadge">Aktywna tura</span>}{participant.defeated && <span className="initiativeBadge initiativeBadgeMuted">Pokonany</span>}</td>
                      <td>{isDndMode ? (participant.initiative ?? "-") : (participant.dex ?? "-")}</td>
                      {isDndMode ? <td>{participant.ac ?? "-"}</td> : null}
                      <td>
                        <input
                          className="initiativeHpInlineInput"
                          aria-label={`HP ${participant.name}`}
                          type="number"
                          min="0"
                          value={participant.hp ?? 0}
                          onChange={(e) => {
                            const nextHp = Math.max(0, Number(e.target.value || 0));
                            patchParticipant(participant.id, (item) => ({ ...item, hp: nextHp, defeated: nextHp <= 0 }));
                          }}
                        />
                        <span className="initiativeHpInlineMax">/ {participant.maxHp ?? "-"}</span>
                      </td>
                      <td>
                        <div className="initiativeRowActions">
                          <button type="button" className="initiativeDeleteBtn" aria-label={`Usun ${participant.name}`} onClick={() => removeParticipant(participant.id)}>x</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isAddModalOpen && (
        <div className="initiativeModalOverlay" role="dialog" aria-modal="true">
          <div className="initiativeModal">
            <div className="initiativeModalHeader">
              <h3>Dodaj uczestnika</h3>
              <button type="button" className="btn" onClick={() => setAddModalOpen(false)}>Zamknij</button>
            </div>
            <form className="initiativeModalBody" onSubmit={handleAddCustomParticipant}>
              {isDndMode ? (
                <select aria-label="Pula potworow" value={selectedMonsterIndex} onChange={(e) => void handleSelectMonster(e.target.value)}>
                  <option value="">{monsterLoading ? "Ladowanie potworow..." : "Wybierz potwora (opcjonalnie)"}</option>
                  {monsterResults.map((monster) => <option key={monster.index} value={monster.index}>{monster.name}</option>)}
                </select>
              ) : null}
              <input aria-label="Nazwa uczestnika" placeholder="Nazwa" value={customForm.name} onChange={(e) => setCustomForm((prev) => ({ ...prev, name: e.target.value }))} />
              <select aria-label="Typ" value={customForm.type} onChange={(e) => setCustomForm((prev) => ({ ...prev, type: e.target.value, color: colorForType(e.target.value) }))}>
                {TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <input aria-label="Kolor" type="color" value={customForm.color} onChange={(e) => setCustomForm((prev) => ({ ...prev, color: e.target.value }))} />
              {isDndMode ? (
                <>
                  <input aria-label="Modyfikator inicjatywy" type="number" placeholder="Modyfikator inicjatywy" value={customForm.initiativeModifier} onChange={(e) => setCustomForm((prev) => ({ ...prev, initiativeModifier: e.target.value }))} />
                  <input aria-label="Inicjatywa" type="number" placeholder="Inicjatywa reczna" value={customForm.initiative} onChange={(e) => setCustomForm((prev) => ({ ...prev, initiative: e.target.value }))} />
                  <input aria-label="AC" type="number" placeholder="AC" value={customForm.ac} onChange={(e) => setCustomForm((prev) => ({ ...prev, ac: e.target.value }))} />
                </>
              ) : (
                <input aria-label="ZR / DEX" type="number" placeholder="ZR / DEX" value={customForm.dex} onChange={(e) => setCustomForm((prev) => ({ ...prev, dex: e.target.value }))} />
              )}
              <input aria-label="HP" type="number" placeholder="HP" value={customForm.hp} onChange={(e) => setCustomForm((prev) => ({ ...prev, hp: e.target.value }))} />
              <input aria-label="Max HP" type="number" placeholder="Max HP" value={customForm.maxHp} onChange={(e) => setCustomForm((prev) => ({ ...prev, maxHp: e.target.value }))} />
              <button className="btn btn-primary" type="submit">Dodaj do walki</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
