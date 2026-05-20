import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  addEncounterParticipant,
  applyParticipantDamage,
  createDiceRoll,
  createEncounter,
  defeatParticipant,
  deleteEncounter,
  finishEncounter,
  getCampaignCharacters,
  getCampaignDiceRolls,
  getCampaignEncounters,
  healParticipant,
  listCampaigns,
  nextEncounterTurn,
  previousEncounterTurn,
  removeEncounterParticipant,
  restoreParticipant,
  setParticipantConditions,
  setParticipantTemporaryHp,
} from "../api/campaigns";
import { formatHpText, formatParticipantStatus, formatRollSummary } from "./initiativeUtils";
import "../styles/initiative.css";

const PARTICIPANT_TYPES = ["PLAYER_CHARACTER", "NPC", "MONSTER", "CUSTOM"];
const ROLL_TYPES = ["GENERIC", "ATTACK", "DAMAGE", "SAVE", "SKILL", "INITIATIVE", "CUSTOM"];

function toInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ParticipantRow({ participant, isTurn, actionBusy, onMutate }) {
  const [damageValue, setDamageValue] = useState("0");
  const [healValue, setHealValue] = useState("0");
  const [tempValue, setTempValue] = useState(String(participant.tempHp ?? 0));
  const [conditionsValue, setConditionsValue] = useState(participant.conditions || "");

  useEffect(() => {
    setTempValue(String(participant.tempHp ?? 0));
  }, [participant.tempHp]);

  useEffect(() => {
    setConditionsValue(participant.conditions || "");
  }, [participant.conditions]);

  return (
    <tr className={isTurn ? "is-active-turn" : ""}>
      <td>{participant.name}</td>
      <td>{participant.participantType}</td>
      <td>{participant.initiativeValue}</td>
      <td>{participant.initiativeModifier ?? 0}</td>
      <td>{formatHpText(participant.currentHp, participant.maxHp)}</td>
      <td>{participant.tempHp ?? 0}</td>
      <td>{participant.armorClass ?? "—"}</td>
      <td>{participant.conditions || "—"}</td>
      <td>{formatParticipantStatus(participant)}</td>
      <td>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="cellInput cellInput--tiny" value={damageValue} onChange={(e) => setDamageValue(e.target.value)} />
            <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "damage", damageValue)} disabled={!!actionBusy}>DMG</button>
            <input className="cellInput cellInput--tiny" value={healValue} onChange={(e) => setHealValue(e.target.value)} />
            <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "heal", healValue)} disabled={!!actionBusy}>HEAL</button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="cellInput cellInput--tiny" value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
            <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "temp", tempValue)} disabled={!!actionBusy}>Set Temp</button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="cellInput cellInput--note" value={conditionsValue} onChange={(e) => setConditionsValue(e.target.value)} />
            <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "conditions", conditionsValue)} disabled={!!actionBusy}>Set Cond.</button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "defeat")} disabled={!!actionBusy}>Defeat</button>
            <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "restore")} disabled={!!actionBusy}>Restore</button>
            <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "remove")} disabled={!!actionBusy}>Remove</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function InitiativePage() {
  const { token } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const [encounters, setEncounters] = useState([]);
  const [encounterLoading, setEncounterLoading] = useState(false);
  const [encounterError, setEncounterError] = useState("");
  const [selectedEncounterId, setSelectedEncounterId] = useState("");
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [actionBusy, setActionBusy] = useState("");

  const [campaignCharacters, setCampaignCharacters] = useState([]);

  const [encounterForm, setEncounterForm] = useState({ name: "", systemCode: "dnd5e", sessionId: "" });
  const [customForm, setCustomForm] = useState({
    name: "",
    participantType: "MONSTER",
    initiativeValue: 10,
    initiativeModifier: 0,
    maxHp: "",
    currentHp: "",
  });
  const [characterForm, setCharacterForm] = useState({
    characterId: "",
    initiativeValue: 10,
    initiativeModifier: 0,
    maxHp: "",
    currentHp: "",
  });
  const [diceForm, setDiceForm] = useState({ rollExpression: "1d20+3", rollLabel: "", rollType: "GENERIC" });
  const [diceRolls, setDiceRolls] = useState([]);
  const [diceLoading, setDiceLoading] = useState(false);
  const [diceError, setDiceError] = useState("");

  const [stateError, setStateError] = useState("");

  const selectedCampaign = useMemo(
    () => campaigns.find((item) => String(item.id) === String(selectedCampaignId)) || null,
    [campaigns, selectedCampaignId]
  );

  const activeParticipants = useMemo(
    () => (activeEncounter?.participants || []).filter((item) => item.isActive && !item.isDefeated),
    [activeEncounter]
  );

  const currentParticipantId = activeEncounter?.currentParticipantId ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadCampaigns() {
      setCampaignLoading(true);
      setCampaignError("");
      try {
        const data = await listCampaigns(token);
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setCampaigns(list);
        const cached = sessionStorage.getItem("initiative_selected_campaign_id") || "";
        const found = list.find((item) => String(item.id) === String(cached));
        const next = found?.id || list[0]?.id || "";
        setSelectedCampaignId(next ? String(next) : "");
      } catch (err) {
        if (!cancelled) setCampaignError(err?.message || "Nie udało się pobrać kampanii.");
      } finally {
        if (!cancelled) setCampaignLoading(false);
      }
    }
    loadCampaigns();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (selectedCampaignId) {
      sessionStorage.setItem("initiative_selected_campaign_id", String(selectedCampaignId));
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!selectedCampaignId) {
      setEncounters([]);
      setActiveEncounter(null);
      setSelectedEncounterId("");
      return;
    }
    void refreshEncounters(selectedCampaignId, true);
    void refreshCharacters(selectedCampaignId);
    void refreshDiceRolls(selectedCampaignId, selectedEncounterId || null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!selectedCampaignId || !selectedEncounterId) {
      setActiveEncounter(null);
      return;
    }
    const found = encounters.find((item) => String(item.id) === String(selectedEncounterId));
    setActiveEncounter(found || null);
    void refreshDiceRolls(selectedCampaignId, selectedEncounterId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEncounterId, encounters]);

  async function refreshEncounters(campaignId, autoSelect = false) {
    setEncounterLoading(true);
    setEncounterError("");
    try {
      const data = await getCampaignEncounters(token, campaignId);
      const list = Array.isArray(data) ? data : [];
      setEncounters(list);
      if (autoSelect) {
        const active = list.find((item) => item.status === "ACTIVE");
        setSelectedEncounterId(String(active?.id || list[0]?.id || ""));
      } else if (selectedEncounterId && !list.some((item) => String(item.id) === String(selectedEncounterId))) {
        setSelectedEncounterId(String(list[0]?.id || ""));
      }
    } catch (err) {
      setEncounterError(err?.message || "Nie udało się pobrać encounterów.");
    } finally {
      setEncounterLoading(false);
    }
  }

  async function refreshCharacters(campaignId) {
    try {
      const list = await getCampaignCharacters(token, campaignId);
      setCampaignCharacters(Array.isArray(list) ? list : []);
    } catch {
      setCampaignCharacters([]);
    }
  }

  async function refreshDiceRolls(campaignId, encounterId) {
    if (!campaignId) return;
    setDiceLoading(true);
    setDiceError("");
    try {
      const rolls = await getCampaignDiceRolls(token, campaignId, {
        limit: 30,
        encounterId: encounterId || undefined,
      });
      setDiceRolls(Array.isArray(rolls) ? rolls : []);
    } catch (err) {
      setDiceError(err?.message || "Nie udało się pobrać historii rzutów.");
    } finally {
      setDiceLoading(false);
    }
  }

  async function runAction(key, fn) {
    setActionBusy(key);
    setStateError("");
    try {
      await fn();
    } catch (err) {
      setStateError(err?.message || "Operacja nie powiodła się.");
    } finally {
      setActionBusy("");
    }
  }

  async function handleCreateEncounter(event) {
    event.preventDefault();
    if (!selectedCampaignId || !encounterForm.name.trim()) return;
    await runAction("create-encounter", async () => {
      await createEncounter(token, selectedCampaignId, {
        name: encounterForm.name.trim(),
        systemCode: encounterForm.systemCode || "dnd5e",
        sessionId: encounterForm.sessionId ? Number(encounterForm.sessionId) : null,
      });
      setEncounterForm((prev) => ({ ...prev, name: "", sessionId: "" }));
      await refreshEncounters(selectedCampaignId, true);
    });
  }

  async function handleAddCustomParticipant(event) {
    event.preventDefault();
    if (!selectedCampaignId || !selectedEncounterId || !customForm.name.trim()) return;
    await runAction("add-custom", async () => {
      await addEncounterParticipant(token, selectedCampaignId, selectedEncounterId, {
        name: customForm.name.trim(),
        participantType: customForm.participantType,
        initiativeValue: toInt(customForm.initiativeValue, 0),
        initiativeModifier: toInt(customForm.initiativeModifier, 0),
        maxHp: customForm.maxHp === "" ? null : toInt(customForm.maxHp, 0),
        currentHp: customForm.currentHp === "" ? null : toInt(customForm.currentHp, 0),
      });
      setCustomForm((prev) => ({ ...prev, name: "", maxHp: "", currentHp: "" }));
      await refreshEncounters(selectedCampaignId);
    });
  }

  async function handleAddCharacterParticipant(event) {
    event.preventDefault();
    if (!selectedCampaignId || !selectedEncounterId || !characterForm.characterId) return;
    await runAction("add-character", async () => {
      await addEncounterParticipant(token, selectedCampaignId, selectedEncounterId, {
        characterId: Number(characterForm.characterId),
        initiativeValue: toInt(characterForm.initiativeValue, 0),
        initiativeModifier: toInt(characterForm.initiativeModifier, 0),
        maxHp: characterForm.maxHp === "" ? null : toInt(characterForm.maxHp, 0),
        currentHp: characterForm.currentHp === "" ? null : toInt(characterForm.currentHp, 0),
      });
      await refreshEncounters(selectedCampaignId);
    });
  }

  async function handleCreateDiceRoll(event) {
    event.preventDefault();
    if (!selectedCampaignId || !diceForm.rollExpression.trim()) return;
    await runAction("dice-roll", async () => {
      await createDiceRoll(token, selectedCampaignId, {
        encounterId: selectedEncounterId ? Number(selectedEncounterId) : null,
        rollExpression: diceForm.rollExpression.trim(),
        rollLabel: diceForm.rollLabel.trim() || null,
        rollType: diceForm.rollType || "GENERIC",
      });
      await refreshDiceRolls(selectedCampaignId, selectedEncounterId || null);
    });
  }

  async function handleParticipantMutation(participantId, type, value = null) {
    if (!selectedCampaignId || !selectedEncounterId) return;
    await runAction(`${type}-${participantId}`, async () => {
      if (type === "damage") {
        await applyParticipantDamage(token, selectedCampaignId, selectedEncounterId, participantId, Math.max(0, toInt(value, 0)));
      } else if (type === "heal") {
        await healParticipant(token, selectedCampaignId, selectedEncounterId, participantId, Math.max(0, toInt(value, 0)));
      } else if (type === "temp") {
        await setParticipantTemporaryHp(token, selectedCampaignId, selectedEncounterId, participantId, Math.max(0, toInt(value, 0)));
      } else if (type === "conditions") {
        await setParticipantConditions(token, selectedCampaignId, selectedEncounterId, participantId, value || null);
      } else if (type === "defeat") {
        await defeatParticipant(token, selectedCampaignId, selectedEncounterId, participantId);
      } else if (type === "restore") {
        await restoreParticipant(token, selectedCampaignId, selectedEncounterId, participantId);
      } else if (type === "remove") {
        if (!window.confirm("Usunąć uczestnika z encountera?")) return;
        await removeEncounterParticipant(token, selectedCampaignId, selectedEncounterId, participantId);
      }
      await refreshEncounters(selectedCampaignId);
    });
  }

  async function handleTurnAction(type) {
    if (!selectedCampaignId || !selectedEncounterId) return;
    await runAction(type, async () => {
      if (type === "next-turn") {
        await nextEncounterTurn(token, selectedCampaignId, selectedEncounterId);
      } else {
        await previousEncounterTurn(token, selectedCampaignId, selectedEncounterId);
      }
      await refreshEncounters(selectedCampaignId);
    });
  }

  async function handleEncounterStateAction(type) {
    if (!selectedCampaignId || !selectedEncounterId) return;
    await runAction(type, async () => {
      if (type === "finish-encounter") {
        await finishEncounter(token, selectedCampaignId, selectedEncounterId);
      } else if (type === "delete-encounter") {
        if (!window.confirm("Usunąć encounter?")) return;
        await deleteEncounter(token, selectedCampaignId, selectedEncounterId);
      }
      await refreshEncounters(selectedCampaignId, true);
    });
  }

  return (
    <div className="page page--wide initiativePage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">Combat</span>
          <h1 className="pageTitle">Persistent Initiative Tracker</h1>
          <p className="pageSubtitle">Encountery, uczestnicy, tury, HP/stany oraz podstawowa historia rzutów zapisywane w backendzie.</p>
        </div>
      </div>

      <section className="initControlPanel">
        <div className="initSystemBlock">
          <span className="initControlLabel">Kampania</span>
          {campaignLoading ? (
            <div>Ładowanie kampanii...</div>
          ) : (
            <select className="cellSelect" value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)}>
              {campaigns.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          )}
          {campaignError && <div className="campaignDetailsError">{campaignError}</div>}
        </div>

        <form onSubmit={handleCreateEncounter} className="initToolbar" style={{ alignItems: "flex-end" }}>
          <label>
            <div className="initControlLabel">Nowy encounter</div>
            <input className="cellInput" value={encounterForm.name} onChange={(e) => setEncounterForm((p) => ({ ...p, name: e.target.value }))} placeholder="np. Starcie w ruinach" />
          </label>
          <label>
            <div className="initControlLabel">System</div>
            <input className="cellInput" value={encounterForm.systemCode} onChange={(e) => setEncounterForm((p) => ({ ...p, systemCode: e.target.value }))} />
          </label>
          <button className="btn btn-primary" disabled={!selectedCampaignId || actionBusy === "create-encounter"} type="submit">
            {actionBusy === "create-encounter" ? "Tworzenie..." : "Utwórz encounter"}
          </button>
        </form>
      </section>

      <section className="initControlPanel">
        <div className="initSystemBlock">
          <span className="initControlLabel">Encounter</span>
          {encounterLoading ? (
            <div>Ładowanie encounterów...</div>
          ) : (
            <select className="cellSelect" value={selectedEncounterId} onChange={(event) => setSelectedEncounterId(event.target.value)}>
              <option value="">— wybierz encounter —</option>
              {encounters.map((enc) => (
                <option key={enc.id} value={enc.id}>
                  {enc.name} ({enc.status})
                </option>
              ))}
            </select>
          )}
          {encounterError && <div className="campaignDetailsError">{encounterError}</div>}
        </div>

        <div className="initToolbar">
          <button className="btn" onClick={() => handleTurnAction("previous-turn")} disabled={!selectedEncounterId || !!actionBusy} type="button">← Poprzednia</button>
          <button className="btn" onClick={() => handleTurnAction("next-turn")} disabled={!selectedEncounterId || !!actionBusy} type="button">Następna →</button>
          <button className="btn" onClick={() => handleEncounterStateAction("finish-encounter")} disabled={!selectedEncounterId || !!actionBusy} type="button">Zakończ</button>
          <button className="btn" onClick={() => handleEncounterStateAction("delete-encounter")} disabled={!selectedEncounterId || !!actionBusy} type="button">Usuń</button>
        </div>
      </section>

      {selectedCampaign && !selectedEncounterId && !encounterLoading && (
        <div className="empty">
          <div className="emptyTitle">Brak encounterów</div>
          <div className="emptyText">Utwórz pierwszy encounter dla kampanii: {selectedCampaign.title}.</div>
        </div>
      )}

      {activeEncounter && (
        <>
          <div className="initMeta">
            Encounter: {activeEncounter.name} • status: {activeEncounter.status} • runda: {activeEncounter.roundNumber} • aktywni: {activeParticipants.length}
          </div>

          <section className="initTableWrap initTableWrap--wide">
            {(activeEncounter.participants || []).length === 0 ? (
              <div className="empty">
                <div className="emptyTitle">Brak participantów</div>
                <div className="emptyText">Dodaj postać kampanii albo customowego przeciwnika.</div>
              </div>
            ) : (
              <div className="initTableScroll">
                <table className="initTable">
                  <thead>
                    <tr>
                      <th>Uczestnik</th>
                      <th>Typ</th>
                      <th>Init</th>
                      <th>Modyf.</th>
                      <th>HP</th>
                      <th>Temp</th>
                      <th>AC</th>
                      <th>Conditions</th>
                      <th>Status</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEncounter.participants.map((participant) => (
                      <ParticipantRow
                        key={participant.id}
                        participant={participant}
                        isTurn={currentParticipantId === participant.id}
                        actionBusy={actionBusy}
                        onMutate={handleParticipantMutation}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="initControlPanel">
            <form onSubmit={handleAddCustomParticipant} className="initToolbar" style={{ alignItems: "flex-end" }}>
              <span className="initControlLabel">Dodaj custom participant</span>
              <input className="cellInput" placeholder="Nazwa" value={customForm.name} onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))} />
              <select className="cellSelect" value={customForm.participantType} onChange={(e) => setCustomForm((p) => ({ ...p, participantType: e.target.value }))}>
                {PARTICIPANT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input className="cellInput cellInput--tiny" type="number" placeholder="Init" value={customForm.initiativeValue} onChange={(e) => setCustomForm((p) => ({ ...p, initiativeValue: e.target.value }))} />
              <input className="cellInput cellInput--tiny" type="number" placeholder="Mod" value={customForm.initiativeModifier} onChange={(e) => setCustomForm((p) => ({ ...p, initiativeModifier: e.target.value }))} />
              <input className="cellInput cellInput--tiny" type="number" placeholder="Max HP" value={customForm.maxHp} onChange={(e) => setCustomForm((p) => ({ ...p, maxHp: e.target.value }))} />
              <input className="cellInput cellInput--tiny" type="number" placeholder="Cur HP" value={customForm.currentHp} onChange={(e) => setCustomForm((p) => ({ ...p, currentHp: e.target.value }))} />
              <button className="btn btn-primary" disabled={!!actionBusy || !selectedEncounterId} type="submit">Dodaj custom</button>
            </form>
          </section>

          <section className="initControlPanel">
            <form onSubmit={handleAddCharacterParticipant} className="initToolbar" style={{ alignItems: "flex-end" }}>
              <span className="initControlLabel">Dodaj postać kampanii</span>
              <select className="cellSelect" value={characterForm.characterId} onChange={(e) => setCharacterForm((p) => ({ ...p, characterId: e.target.value }))}>
                <option value="">— wybierz postać —</option>
                {campaignCharacters.map((character) => (
                  <option key={character.characterId} value={character.characterId}>{character.characterName}</option>
                ))}
              </select>
              <input className="cellInput cellInput--tiny" type="number" placeholder="Init" value={characterForm.initiativeValue} onChange={(e) => setCharacterForm((p) => ({ ...p, initiativeValue: e.target.value }))} />
              <input className="cellInput cellInput--tiny" type="number" placeholder="Mod" value={characterForm.initiativeModifier} onChange={(e) => setCharacterForm((p) => ({ ...p, initiativeModifier: e.target.value }))} />
              <input className="cellInput cellInput--tiny" type="number" placeholder="Max HP" value={characterForm.maxHp} onChange={(e) => setCharacterForm((p) => ({ ...p, maxHp: e.target.value }))} />
              <input className="cellInput cellInput--tiny" type="number" placeholder="Cur HP" value={characterForm.currentHp} onChange={(e) => setCharacterForm((p) => ({ ...p, currentHp: e.target.value }))} />
              <button className="btn btn-primary" disabled={!!actionBusy || !selectedEncounterId || !characterForm.characterId} type="submit">Dodaj postać</button>
            </form>
          </section>

          <section className="initControlPanel">
            <form onSubmit={handleCreateDiceRoll} className="initToolbar" style={{ alignItems: "flex-end" }}>
              <span className="initControlLabel">Szybki rzut (zapis do historii)</span>
              <input className="cellInput" placeholder="np. 1d20+3" value={diceForm.rollExpression} onChange={(e) => setDiceForm((p) => ({ ...p, rollExpression: e.target.value }))} />
              <input className="cellInput" placeholder="Label (opcjonalnie)" value={diceForm.rollLabel} onChange={(e) => setDiceForm((p) => ({ ...p, rollLabel: e.target.value }))} />
              <select className="cellSelect" value={diceForm.rollType} onChange={(e) => setDiceForm((p) => ({ ...p, rollType: e.target.value }))}>
                {ROLL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <button className="btn btn-primary" disabled={!!actionBusy || !selectedCampaignId} type="submit">Rzuć</button>
            </form>
          </section>

          <section className="initTableWrap initTableWrap--wide">
            <div className="initMeta">Historia rzutów {selectedEncounterId ? "(filtrowana po encounterze)" : "(kampania)"}</div>
            {diceLoading ? (
              <div>Ładowanie rzutów...</div>
            ) : diceRolls.length === 0 ? (
              <div className="empty">
                <div className="emptyTitle">Brak rzutów</div>
                <div className="emptyText">Wykonaj pierwszy rzut, aby zapisać go w historii.</div>
              </div>
            ) : (
              <div className="initTableScroll">
                <table className="initTable">
                  <thead>
                    <tr>
                      <th>Expression</th>
                      <th>Total</th>
                      <th>Label</th>
                      <th>Type</th>
                      <th>Autor</th>
                      <th>Czas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diceRolls.map((roll) => (
                      <tr key={roll.id}>
                        <td>{formatRollSummary(roll)}</td>
                        <td>{roll.total}</td>
                        <td>{roll.rollLabel || "—"}</td>
                        <td>{roll.rollType}</td>
                        <td>{roll.rolledByUsername || roll.rolledByUserId}</td>
                        <td>{new Date(roll.createdAt).toLocaleString("pl-PL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {diceError && <div className="campaignDetailsError">{diceError}</div>}
          </section>
        </>
      )}

      {stateError && <div className="campaignDetailsError">{stateError}</div>}
      <div className="initMeta">
        Fallback/TODO: poprzedni lokalny tracker (sessionStorage-only) został zastąpiony persistent mode; jeśli backend będzie niedostępny, planowany jest osobny local fallback toggle.
      </div>
    </div>
  );
}
