import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getDndConditions, getDndMonsterDetails, searchDndMonsters } from "../../api/initiative";
import "../../styles/initiative.css";

const STORAGE_KEY = "ttrpg.quickInitiativeTracker";
const LOOKUP_ERROR_MESSAGE = "Nie udalo sie pobrac danych z bazy D&D. Mozesz dodac uczestnika recznie.";

const FALLBACK_CONDITIONS = [
  "blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated", "invisible",
  "paralyzed", "petrified", "poisoned", "prone", "restrained", "stunned", "unconscious", "exhausted",
];

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
    ac: toOptionalNumber(raw.ac),
    hp: toOptionalNumber(raw.hp),
    maxHp: toOptionalNumber(raw.maxHp),
    type,
    color: raw.color || colorForType(type),
    conditions: Array.isArray(raw.conditions) ? raw.conditions.map(String) : [],
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

function reindexOrder(list) {
  return list.map((item, index) => ({ ...item, order: index + 1 }));
}

function createInitialState() {
  if (typeof window === "undefined") {
    return { participants: [], started: false, round: 1, activeParticipantId: null, orderCounter: 1, initiativeRolled: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { participants: [], started: false, round: 1, activeParticipantId: null, orderCounter: 1, initiativeRolled: false };
    const parsed = JSON.parse(raw);
    const participants = Array.isArray(parsed.participants) ? parsed.participants.map(sanitizeParticipant) : [];
    const ordered = byOrder(participants);
    const fromLegacyIndex = Number.isInteger(parsed.currentTurnIndex) && ordered[parsed.currentTurnIndex]
      ? ordered[parsed.currentTurnIndex].id
      : null;
    return {
      participants: ordered,
      started: Boolean(parsed.started),
      round: Number.isFinite(Number(parsed.round)) ? Math.max(1, Number(parsed.round)) : 1,
      activeParticipantId: parsed.activeParticipantId || fromLegacyIndex || null,
      orderCounter: Number.isFinite(Number(parsed.orderCounter)) ? Number(parsed.orderCounter) : ordered.length + 1,
      initiativeRolled: Boolean(parsed.initiativeRolled),
    };
  } catch {
    return { participants: [], started: false, round: 1, activeParticipantId: null, orderCounter: 1, initiativeRolled: false };
  }
}

export default function InitiativePage() {
  const { token } = useAuth();
  const [state, setState] = useState(createInitialState);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [conditions, setConditions] = useState(FALLBACK_CONDITIONS);
  const [usedConditionsFallback, setUsedConditionsFallback] = useState(false);

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM_FORM);

  const [monsterResults, setMonsterResults] = useState([]);
  const [monsterLoading, setMonsterLoading] = useState(false);
  const [selectedMonsterIndex, setSelectedMonsterIndex] = useState("");

  const [conditionDrafts, setConditionDrafts] = useState({});
  const [hpAmountDrafts, setHpAmountDrafts] = useState({});
  const [hpSetDrafts, setHpSetDrafts] = useState({});
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const orderedParticipants = useMemo(() => byOrder(state.participants), [state.participants]);
  const activeParticipant = orderedParticipants.find((item) => item.id === state.activeParticipantId) || null;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore localStorage failures
    }
  }, [state]);

  useEffect(() => {
    async function loadConditions() {
      try {
        const response = await getDndConditions(token);
        if (!Array.isArray(response) || response.length === 0) {
          setConditions(FALLBACK_CONDITIONS);
          setUsedConditionsFallback(true);
          return;
        }
        setConditions(response.map((item) => String(item.name || item.index || "")).filter(Boolean));
        setUsedConditionsFallback(false);
      } catch {
        setConditions(FALLBACK_CONDITIONS);
        setUsedConditionsFallback(true);
      }
    }
    void loadConditions();
  }, [token]);

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
          ac: partial.ac ?? null,
          hp,
          maxHp: partial.maxHp ?? null,
          type: partial.type || "ENEMY",
          color: partial.color || colorForType(partial.type || "ENEMY"),
          conditions: partial.conditions || [],
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
      ac: toOptionalNumber(customForm.ac),
      hp,
      maxHp,
      note: "",
      sourceType: selectedMonsterIndex ? "DND_MONSTER" : "CUSTOM",
      sourceIndex: selectedMonsterIndex || null,
      sourceName: selectedMonsterIndex ? name : null,
    });

    setCustomForm((prev) => ({ ...EMPTY_CUSTOM_FORM, type: prev.type, color: colorForType(prev.type) }));
    setSelectedMonsterIndex("");
    setAddModalOpen(false);
  }

  async function loadMonsters() {
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

  async function handleSelectMonster(index) {
    if (!index) return;
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
        ac: details.armorClass == null ? "" : String(details.armorClass),
        hp: details.hitPoints == null ? "" : String(details.hitPoints),
        maxHp: details.hitPoints == null ? "" : String(details.hitPoints),
        note: `CR ${details.challengeRating ?? "-"}, ${details.type || "monster"}`,
      }));
    } catch {
      setError(LOOKUP_ERROR_MESSAGE);
    }
  }

  function startCombat() {
    setState((prev) => {
      const sorted = reindexOrder(byInitiative(prev.participants));
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

  function moveTurn(direction) {
    setState((prev) => {
      const queue = byOrder(prev.participants).filter((item) => !item.defeated);
      if (!queue.length) return { ...prev, started: true, activeParticipantId: null };
      const currentIndex = queue.findIndex((item) => item.id === prev.activeParticipantId);
      if (currentIndex < 0) {
        return { ...prev, started: true, activeParticipantId: queue[0].id };
      }
      if (direction === "next") {
        const nextIndex = (currentIndex + 1) % queue.length;
        return {
          ...prev,
          started: true,
          activeParticipantId: queue[nextIndex].id,
          round: nextIndex <= currentIndex ? prev.round + 1 : prev.round,
        };
      }
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      return {
        ...prev,
        started: true,
        activeParticipantId: queue[prevIndex].id,
        round: prevIndex >= currentIndex ? Math.max(1, prev.round - 1) : prev.round,
      };
    });
  }

  function resetTurns() {
    setState((prev) => ({ ...prev, started: false, round: 1, activeParticipantId: prev.participants[0]?.id || null }));
  }

  function endCombat() {
    setState((prev) => ({
      ...prev,
      started: false,
      initiativeRolled: false,
      round: 1,
      activeParticipantId: byOrder(prev.participants)[0]?.id || null,
    }));
  }

  function clearAll() {
    setState({ participants: [], started: false, round: 1, activeParticipantId: null, orderCounter: 1, initiativeRolled: false });
    setConditionDrafts({});
    setHpAmountDrafts({});
    setHpSetDrafts({});
    setDraggedId(null);
    setDragOverId(null);
    setNotice("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (isAddModalOpen && monsterResults.length === 0) {
      void loadMonsters();
    }
  }, [isAddModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function sortByInitiativeAction() {
    setState((prev) => {
      const activeId = prev.activeParticipantId;
      const sorted = reindexOrder(byInitiative(prev.participants));
      const hasActive = sorted.some((item) => item.id === activeId);
      return {
        ...prev,
        participants: sorted,
        activeParticipantId: hasActive ? activeId : sorted[0]?.id || null,
      };
    });
  }

  function patchParticipant(id, patchFn) {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.map((item) => (item.id === id ? patchFn(item) : item)),
    }));
  }

  function removeParticipant(id) {
    setState((prev) => {
      const next = prev.participants.filter((item) => item.id !== id);
      const reindexed = reindexOrder(byOrder(next));
      const hasActive = reindexed.some((item) => item.id === prev.activeParticipantId);
      return {
        ...prev,
        participants: reindexed,
        activeParticipantId: hasActive ? prev.activeParticipantId : reindexed[0]?.id || null,
      };
    });
  }

  function applyDamage(participant) {
    const amount = toOptionalNumber(hpAmountDrafts[participant.id]) ?? 0;
    if (amount <= 0) return;
    patchParticipant(participant.id, (item) => {
      const nextHp = Math.max(0, (item.hp ?? 0) - amount);
      return { ...item, hp: nextHp, defeated: nextHp <= 0 };
    });
  }

  function applyHeal(participant) {
    const amount = toOptionalNumber(hpAmountDrafts[participant.id]) ?? 0;
    if (amount <= 0) return;
    patchParticipant(participant.id, (item) => {
      const base = (item.hp ?? 0) + amount;
      const max = item.maxHp == null ? base : Math.min(base, item.maxHp);
      const nextHp = Math.max(0, max);
      return { ...item, hp: nextHp, defeated: nextHp <= 0 };
    });
  }

  function setHp(participant) {
    const next = toOptionalNumber(hpSetDrafts[participant.id]);
    if (next === null) return;
    patchParticipant(participant.id, (item) => {
      const nextHp = Math.max(0, next);
      return { ...item, hp: nextHp, defeated: nextHp <= 0 };
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
      return {
        ...prev,
        participants: reindexOrder(moved),
      };
    });
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div className="page page--wide initiativePage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">Combat</span>
          <h1 className="pageTitle">Inicjatywa D&D</h1>
          <p className="pageSubtitle">Szybki tracker walki dla MG. Dodaj uczestnikow, ustaw inicjatywe, AC i HP, a nastepnie prowadz tury bez przypisywania walki do kampanii.</p>
        </div>
      </div>

      <section className="card initiativeControlsCard">
        <div className="initiativeControlsSummary">
          <p>Runda: <strong>{state.round}</strong></p>
          <p>Aktywna tura: <strong>{activeParticipant ? activeParticipant.name : "Brak"}</strong></p>
        </div>
        <div className="initiativeActions">
          <button className="btn btn-primary" type="button" onClick={() => setAddModalOpen(true)}>Dodaj uczestnika</button>
          <button className="btn btn-primary" type="button" onClick={startCombat}>Start walki</button>
          <button className="btn" type="button" onClick={rollInitiative} disabled={state.initiativeRolled || state.participants.length === 0}>Losuj inicjatywe</button>
          <button className="btn" type="button" onClick={sortByInitiativeAction}>Sortuj po inicjatywie</button>
          <button className="btn" type="button" onClick={() => moveTurn("next")}>Nastepna tura</button>
          <button className="btn" type="button" onClick={() => moveTurn("prev")}>Poprzednia tura</button>
          <button className="btn" type="button" onClick={resetTurns}>Reset tur</button>
          <button className="btn" type="button" onClick={endCombat}>Zakoncz walke</button>
          <button className="btn" type="button" onClick={clearAll}>Wyczysc wszystko</button>
        </div>
        {notice && <p className="initiativeNotice">{notice}</p>}
        {usedConditionsFallback && <p className="initiativeWarning">Lista stanow z API jest chwilowo niedostepna. Uzyto listy lokalnej.</p>}
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
                  <th>Marker</th><th>Typ</th><th>Nazwa</th><th>Inicjatywa</th><th>AC</th><th>HP</th><th>Stany</th><th>Akcje</th>
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
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverId(participant.id);
                      }}
                      onDrop={() => handleDrop(participant.id)}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                    >
                      <td><span className="initiativeColorDot" style={{ backgroundColor: participant.color || colorForType(participant.type) }} /></td>
                      <td>{typeLabel(participant.type)}</td>
                      <td>
                        <strong>{participant.name}</strong>
                        {participant.sourceType === "DND_MONSTER" && <span className="initiativeBadge initiativeBadgeMuted">D&D Monster</span>}
                        {isActive && <span className="initiativeBadge">Aktywna tura</span>}
                        {participant.defeated && <span className="initiativeBadge initiativeBadgeMuted">Pokonany</span>}
                      </td>
                      <td>{participant.initiative ?? "-"} <small>(mod {participant.initiativeModifier >= 0 ? `+${participant.initiativeModifier}` : participant.initiativeModifier})</small></td>
                      <td>{participant.ac ?? "-"}</td>
                      <td>
                        <div>{participant.hp ?? "-"} / {participant.maxHp ?? "-"}</div>
                        <div className="initiativeHpControls">
                          <input aria-label={`Amount ${participant.name}`} type="number" placeholder="amount" value={hpAmountDrafts[participant.id] ?? ""} onChange={(e) => setHpAmountDrafts((prev) => ({ ...prev, [participant.id]: e.target.value }))} />
                          <button type="button" className="btn" onClick={() => applyDamage(participant)}>Obrazenia</button>
                          <button type="button" className="btn" onClick={() => applyHeal(participant)}>Leczenie</button>
                        </div>
                        <div className="initiativeHpControls">
                          <input aria-label={`Set HP ${participant.name}`} type="number" placeholder="ustaw hp" value={hpSetDrafts[participant.id] ?? ""} onChange={(e) => setHpSetDrafts((prev) => ({ ...prev, [participant.id]: e.target.value }))} />
                          <button type="button" className="btn" onClick={() => setHp(participant)}>Ustaw HP</button>
                        </div>
                      </td>
                      <td>
                        <div className="initiativeConditionList">
                          {participant.conditions.map((condition) => (
                            <button key={`${participant.id}-${condition}`} type="button" className="initiativeTag" onClick={() => patchParticipant(participant.id, (item) => ({ ...item, conditions: item.conditions.filter((entry) => entry !== condition) }))}>{condition} x</button>
                          ))}
                        </div>
                        <div className="initiativeConditionAdd">
                          <select aria-label={`Stan ${participant.name}`} value={conditionDrafts[participant.id] || ""} onChange={(e) => setConditionDrafts((prev) => ({ ...prev, [participant.id]: e.target.value }))}>
                            <option value="">Wybierz stan</option>
                            {conditions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
                          </select>
                          <button type="button" className="btn" onClick={() => {
                            const value = String(conditionDrafts[participant.id] || "").trim();
                            if (!value) return;
                            patchParticipant(participant.id, (item) => ({ ...item, conditions: [...item.conditions, value] }));
                            setConditionDrafts((prev) => ({ ...prev, [participant.id]: "" }));
                          }}>Dodaj stan</button>
                        </div>
                      </td>
                      <td>
                        <div className="initiativeRowActions">
                          <span className="initiativeDragHint">Przeciagnij</span>
                          <button type="button" className="btn" onClick={() => removeParticipant(participant.id)}>Usun</button>
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
              <select aria-label="Pula potworow" value={selectedMonsterIndex} onChange={(e) => void handleSelectMonster(e.target.value)}>
                <option value="">{monsterLoading ? "Ladowanie potworow..." : "Wybierz potwora (opcjonalnie)"}</option>
                {monsterResults.map((monster) => <option key={monster.index} value={monster.index}>{monster.name}</option>)}
              </select>
              <input aria-label="Nazwa uczestnika" placeholder="Nazwa" value={customForm.name} onChange={(e) => setCustomForm((prev) => ({ ...prev, name: e.target.value }))} />
              <select aria-label="Typ" value={customForm.type} onChange={(e) => setCustomForm((prev) => ({ ...prev, type: e.target.value, color: colorForType(e.target.value) }))}>
                {TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <input aria-label="Kolor" type="color" value={customForm.color} onChange={(e) => setCustomForm((prev) => ({ ...prev, color: e.target.value }))} />
              <input aria-label="Modyfikator inicjatywy" type="number" placeholder="Initiative mod" value={customForm.initiativeModifier} onChange={(e) => setCustomForm((prev) => ({ ...prev, initiativeModifier: e.target.value }))} />
              <input aria-label="Inicjatywa" type="number" placeholder="Inicjatywa reczna" value={customForm.initiative} onChange={(e) => setCustomForm((prev) => ({ ...prev, initiative: e.target.value }))} />
              <input aria-label="AC" type="number" placeholder="AC" value={customForm.ac} onChange={(e) => setCustomForm((prev) => ({ ...prev, ac: e.target.value }))} />
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
