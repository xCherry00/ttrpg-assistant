import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
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
} from "../../api/campaigns";
import {
  buildCharacterParticipantPayload,
  buildCustomParticipantPayload,
  buildDiceRollPayload,
  toInt,
} from "./initiativeUtils";
import CampaignEncounterPanel from "./components/CampaignEncounterPanel";
import ParticipantsPanel from "./components/ParticipantsPanel";
import DiceRollPanel from "./components/DiceRollPanel";
import "../../styles/initiative.css";

const PARTICIPANT_TYPES = ["PLAYER_CHARACTER", "NPC", "MONSTER", "CUSTOM"];
const ROLL_TYPES = ["GENERIC", "ATTACK", "DAMAGE", "SAVE", "SKILL", "INITIATIVE", "CUSTOM"];

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
        if (!cancelled) setCampaignError(err?.message || "Nie udalo sie pobrac kampanii.");
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
      setEncounterError(err?.message || "Nie udalo sie pobrac encounterow.");
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
      setDiceError(err?.message || "Nie udalo sie pobrac historii rzutow.");
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
      setStateError(err?.message || "Operacja nie powiodla sie.");
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
      await addEncounterParticipant(token, selectedCampaignId, selectedEncounterId, buildCustomParticipantPayload(customForm));
      setCustomForm((prev) => ({ ...prev, name: "", maxHp: "", currentHp: "" }));
      await refreshEncounters(selectedCampaignId);
    });
  }

  async function handleAddCharacterParticipant(event) {
    event.preventDefault();
    if (!selectedCampaignId || !selectedEncounterId || !characterForm.characterId) return;
    await runAction("add-character", async () => {
      await addEncounterParticipant(token, selectedCampaignId, selectedEncounterId, buildCharacterParticipantPayload(characterForm));
      await refreshEncounters(selectedCampaignId);
    });
  }

  async function handleCreateDiceRoll(event) {
    event.preventDefault();
    if (!selectedCampaignId || !diceForm.rollExpression.trim()) return;
    await runAction("dice-roll", async () => {
      await createDiceRoll(token, selectedCampaignId, buildDiceRollPayload(diceForm, selectedEncounterId));
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
        if (!window.confirm("Usunac uczestnika z encountera?")) return;
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
        if (!window.confirm("Usunac encounter?")) return;
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
          <p className="pageSubtitle">Encountery, uczestnicy, tury, HP/stany oraz podstawowa historia rzutow zapisywane w backendzie.</p>
        </div>
      </div>

      <CampaignEncounterPanel
        campaigns={campaigns}
        campaignLoading={campaignLoading}
        campaignError={campaignError}
        selectedCampaignId={selectedCampaignId}
        onCampaignChange={setSelectedCampaignId}
        encounterForm={encounterForm}
        onEncounterFormChange={setEncounterForm}
        onCreateEncounter={handleCreateEncounter}
        createEncounterBusy={actionBusy === "create-encounter"}
        encounters={encounters}
        encounterLoading={encounterLoading}
        encounterError={encounterError}
        selectedEncounterId={selectedEncounterId}
        onEncounterChange={setSelectedEncounterId}
        onTurnAction={handleTurnAction}
        onEncounterAction={handleEncounterStateAction}
        actionBusy={actionBusy}
        selectedCampaign={selectedCampaign}
        activeEncounter={activeEncounter}
        activeParticipantsCount={activeParticipants.length}
      />

      {activeEncounter && (
        <>
          <ParticipantsPanel
            participants={activeEncounter.participants || []}
            currentParticipantId={activeEncounter.currentParticipantId}
            actionBusy={actionBusy}
            onMutate={handleParticipantMutation}
            participantTypes={PARTICIPANT_TYPES}
            customForm={customForm}
            onCustomFormChange={setCustomForm}
            onSubmitCustom={handleAddCustomParticipant}
            customDisabled={!!actionBusy || !selectedEncounterId}
            campaignCharacters={campaignCharacters}
            characterForm={characterForm}
            onCharacterFormChange={setCharacterForm}
            onSubmitCharacter={handleAddCharacterParticipant}
            characterDisabled={!!actionBusy || !selectedEncounterId || !characterForm.characterId}
          />

          <DiceRollPanel
            rollTypes={ROLL_TYPES}
            form={diceForm}
            onFormChange={setDiceForm}
            onSubmit={handleCreateDiceRoll}
            disabled={!!actionBusy || !selectedCampaignId}
            diceLoading={diceLoading}
            diceRolls={diceRolls}
            diceError={diceError}
            selectedEncounterId={selectedEncounterId}
          />
        </>
      )}

      {stateError && <div className="campaignDetailsError">{stateError}</div>}
      <div className="initMeta">
        Fallback/TODO: poprzedni lokalny tracker (sessionStorage-only) zostal zastapiony persistent mode; jesli backend bedzie niedostepny, planowany jest osobny local fallback toggle.
      </div>
    </div>
  );
}
