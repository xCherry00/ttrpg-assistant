import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  getCampaignById,
  getCampaignCharacters,
  getCampaignDiceRolls,
  getSessionLiveState,
  listCampaignSessions,
  startCampaignSession,
  finishCampaignSession,
  createRequestedRoll,
  getRequestedRolls,
  fulfillRequestedRoll,
  cancelRequestedRoll,
  updateSessionLiveState,
} from "../../api/campaigns";
import "../../styles/live-session.css";

function sessionStatusLabel(status) {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "FINISHED") return "FINISHED";
  return "PLANNED";
}

function formatHp(character) {
  if (character.currentHp == null && character.maxHp == null) return null;
  const current = character.currentHp ?? "?";
  const max = character.maxHp ?? "?";
  return `${current}/${max}`;
}

export default function LiveSessionPage() {
  const { token } = useAuth();
  const { campaignId, sessionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaign, setCampaign] = useState(null);
  const [session, setSession] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [recentRolls, setRecentRolls] = useState([]);
  const [liveState, setLiveState] = useState(null);
  const [savingScene, setSavingScene] = useState(false);
  const [notice, setNotice] = useState("");
  const [sessionActionBusy, setSessionActionBusy] = useState(false);
  const [requestedRolls, setRequestedRolls] = useState([]);

  const isGmView = Boolean(campaign?.owner);

  const roleLabel = useMemo(() => {
    if (isGmView) return "GM/owner";
    return "member/player";
  }, [isGmView]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [campaignData, sessionsData, campaignCharactersData, rollsData, liveStateData, requestedRollsData] = await Promise.all([
          getCampaignById(token, campaignId),
          listCampaignSessions(token, campaignId),
          getCampaignCharacters(token, campaignId),
          getCampaignDiceRolls(token, campaignId, { sessionId, limit: 10 }).catch(() => []),
          getSessionLiveState(token, campaignId, sessionId).catch(() => null),
          getRequestedRolls(token, campaignId, sessionId).catch(() => []),
        ]);
        const resolvedSession = Array.isArray(sessionsData)
          ? sessionsData.find((item) => String(item.id) === String(sessionId)) || null
          : null;
        setCampaign(campaignData);
        setSession(resolvedSession);
        setCampaignCharacters(Array.isArray(campaignCharactersData) ? campaignCharactersData : []);
        setRecentRolls(Array.isArray(rollsData) ? rollsData : []);
        setLiveState(liveStateData);
        setRequestedRolls(Array.isArray(requestedRollsData) ? requestedRollsData : []);
      } catch (err) {
        setError(err?.message || "Nie udalo sie zaladowac live session.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, campaignId, sessionId]);

  async function reloadSessionData() {
    const sessionsData = await listCampaignSessions(token, campaignId);
    const resolvedSession = Array.isArray(sessionsData)
      ? sessionsData.find((item) => String(item.id) === String(sessionId)) || null
      : null;
    setSession(resolvedSession);
    const requested = await getRequestedRolls(token, campaignId, sessionId).catch(() => []);
    setRequestedRolls(Array.isArray(requested) ? requested : []);
  }

  async function handleStartSession() {
    setSessionActionBusy(true);
    setError("");
    setNotice("");
    try {
      await startCampaignSession(token, campaignId, sessionId);
      await reloadSessionData();
      setNotice("Session started.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie rozpoczac sesji.");
    } finally {
      setSessionActionBusy(false);
    }
  }

  async function handleFinishSession() {
    setSessionActionBusy(true);
    setError("");
    setNotice("");
    try {
      await finishCampaignSession(token, campaignId, sessionId);
      await reloadSessionData();
      setNotice("Session finished.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie zakonczyc sesji.");
    } finally {
      setSessionActionBusy(false);
    }
  }

  const isPlanned = session?.status === "PLANNED";
  const isInProgress = session?.status === "IN_PROGRESS";
  const isFinished = session?.status === "FINISHED";

  async function handleCreateRequestedRoll(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      targetMode: String(formData.get("targetMode") || "ALL"),
      targetUserIds: String(formData.get("targetUserIds") || "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0),
      targetCharacterIds: String(formData.get("targetCharacterIds") || "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0),
      rollLabel: String(formData.get("rollLabel") || "").trim(),
      rollType: String(formData.get("rollType") || "SKILL").trim(),
      rollExpression: String(formData.get("rollExpression") || "").trim() || null,
      abilityKey: String(formData.get("abilityKey") || "").trim() || null,
      skillKey: String(formData.get("skillKey") || "").trim() || null,
      dc: String(formData.get("dc") || "").trim() ? Number(formData.get("dc")) : null,
      isDcHidden: formData.get("isDcHidden") === "on",
      showSuccessToPlayer: formData.get("showSuccessToPlayer") === "on",
    };
    setError("");
    setNotice("");
    try {
      await createRequestedRoll(token, campaignId, sessionId, payload);
      await reloadSessionData();
      setNotice("Requested roll utworzony.");
      event.currentTarget.reset();
    } catch (err) {
      setError(err?.message || "Nie udalo sie utworzyc requested roll.");
    }
  }

  async function handleFulfillRequestedRoll(requestId) {
    setError("");
    setNotice("");
    try {
      await fulfillRequestedRoll(token, campaignId, sessionId, requestId, {});
      await reloadSessionData();
      setNotice("Requested roll wykonany.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie wykonac requested roll.");
    }
  }

  async function handleCancelRequestedRoll(requestId) {
    setError("");
    setNotice("");
    try {
      await cancelRequestedRoll(token, campaignId, sessionId, requestId);
      await reloadSessionData();
      setNotice("Requested roll anulowany.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie anulowac requested roll.");
    }
  }

  return (
    <div className="page liveSessionPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">Live Session Room</span>
          <h1 className="pageTitle">{campaign?.title || "Live session"}</h1>
          <p className="pageSubtitle">
            Sesja: {session?.title || `#${sessionId}`} ({sessionStatusLabel(session?.status)}) | Widok: {roleLabel}
          </p>
          {isPlanned && (
            <p className="campaignDetailsEmpty">
              {isGmView ? "Session has not started yet." : "Session has not started yet."}
            </p>
          )}
          {isFinished && <p className="campaignDetailsEmpty">Session ended. Read-only view.</p>}
        </div>
        <div>
          <Link className="campaignDetailsGhostBtn" to={`/campaigns/${campaignId}`}>
            Wroc do campaign workspace
          </Link>
          {isPlanned && isGmView && (
            <button className="campaignDetailsPrimaryBtn" type="button" onClick={handleStartSession} disabled={sessionActionBusy}>
              Rozpocznij sesje
            </button>
          )}
          {isInProgress && isGmView && (
            <button className="campaignDetailsDangerBtn" type="button" onClick={handleFinishSession} disabled={sessionActionBusy}>
              Zakoncz sesje
            </button>
          )}
        </div>
      </div>

      {loading && <div className="liveSessionState">Ladowanie live session...</div>}
      {error && <div className="campaignDetailsError">{error}</div>}
      {notice && <div className="campaignDetailsNotice">{notice}</div>}

      {!loading && !error && (
        <div className="liveSessionGrid">
          <section className="campaignDetailsCard panel-soft">
            <h2 className="campaignDetailsCardTitle">Party / Players</h2>
            {campaignCharacters.length === 0 ? (
              <div className="campaignDetailsEmpty">Brak przypisanych postaci w kampanii.</div>
            ) : (
              <div className="campaignMaterialList">
                {campaignCharacters.map((character) => (
                  <article key={character.characterId} className="campaignMaterialCard">
                    <div className="campaignMaterialCard__top">
                      <strong>{character.characterName || "Unnamed character"}</strong>
                      <span className="campaignMemberBadge">{character.systemCode || "other"}</span>
                    </div>
                    <div className="campaignMaterialMeta">
                      <span>Owner: {character.ownerDisplayName || character.ownerUsername || "-"}</span>
                      {formatHp(character) ? <span>HP: {formatHp(character)}</span> : <span>HP: -</span>}
                    </div>
                    <div className="liveSessionCharacterPortrait">
                      {character.avatarUrl || character.portraitUrl ? (
                        <img
                          src={character.avatarUrl || character.portraitUrl}
                          alt={`Portrait: ${character.characterName || "character"}`}
                        />
                      ) : (
                        <div className="liveSessionPortraitPlaceholder">No portrait</div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="campaignDetailsCard panel-soft">
            <h2 className="campaignDetailsCardTitle">Scene Panel</h2>
            {isGmView && isInProgress ? (
              <form
                className="liveSessionSceneForm"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const payload = {
                    sceneTitle: String(formData.get("sceneTitle") || "").trim(),
                    sceneImageUrl: String(formData.get("sceneImageUrl") || "").trim(),
                    sceneDescription: String(formData.get("sceneDescription") || "").trim(),
                    activeEncounterId: liveState?.activeEncounterId || null,
                  };
                  setSavingScene(true);
                  setNotice("");
                  setError("");
                  try {
                    const updated = await updateSessionLiveState(token, campaignId, sessionId, payload);
                    setLiveState(updated);
                    setNotice("Scene saved.");
                  } catch (err) {
                    setError(err?.message || "Nie udalo sie zapisac sceny.");
                  } finally {
                    setSavingScene(false);
                  }
                }}
              >
                <label className="campaignField">
                  <span>Scene title</span>
                  <input name="sceneTitle" defaultValue={liveState?.sceneTitle || ""} maxLength={160} />
                </label>
                <label className="campaignField">
                  <span>Scene image URL</span>
                  <input name="sceneImageUrl" defaultValue={liveState?.sceneImageUrl || ""} />
                </label>
                <label className="campaignField">
                  <span>Scene description</span>
                  <textarea name="sceneDescription" defaultValue={liveState?.sceneDescription || ""} rows={4} maxLength={5000} />
                </label>
                <button type="submit" className="campaignDetailsPrimaryBtn" disabled={savingScene}>
                  Save scene
                </button>
              </form>
            ) : (
              <div className="liveSessionSceneReadonly">
                <h3>{liveState?.sceneTitle || "Scene title not set"}</h3>
                {liveState?.sceneImageUrl ? (
                  <img src={liveState.sceneImageUrl} alt={liveState.sceneTitle || "Scene image"} className="liveSessionSceneImage" />
                ) : (
                  <div className="liveSessionSceneImagePlaceholder">No scene image yet</div>
                )}
                <p>{liveState?.sceneDescription || "Scene description is not available yet."}</p>
              </div>
            )}
          </section>

          <section className="campaignDetailsCard panel-soft">
            <h2 className="campaignDetailsCardTitle">Requested Rolls</h2>
            {isPlanned && <p className="liveSessionPlaceholder">Mechanika bedzie dostepna po rozpoczeciu sesji.</p>}
            {isFinished && <p className="liveSessionPlaceholder">Sesja zakonczona. Requested rolls w trybie read-only.</p>}
            {isInProgress && isGmView && (
              <form className="campaignFormCard" onSubmit={handleCreateRequestedRoll}>
                <label className="campaignField"><span>Target mode</span><select name="targetMode" defaultValue="ALL"><option value="ALL">ALL</option><option value="CHARACTER">CHARACTER</option><option value="USER">USER</option></select></label>
                <label className="campaignField"><span>Target character IDs (comma)</span><input name="targetCharacterIds" placeholder="1,2,3" /></label>
                <label className="campaignField"><span>Target user IDs (comma)</span><input name="targetUserIds" placeholder="10,11" /></label>
                <label className="campaignField"><span>Label</span><input name="rollLabel" maxLength={160} required /></label>
                <label className="campaignField"><span>Roll type</span><input name="rollType" defaultValue="SKILL" maxLength={40} /></label>
                <label className="campaignField"><span>Roll expression</span><input name="rollExpression" defaultValue={campaign?.systemCode === "dnd5e" ? "1d20" : ""} maxLength={120} /></label>
                <label className="campaignField"><span>Ability key</span><input name="abilityKey" maxLength={80} /></label>
                <label className="campaignField"><span>Skill key</span><input name="skillKey" maxLength={80} /></label>
                <label className="campaignField"><span>DC</span><input name="dc" type="number" min="0" /></label>
                <label className="campaignField"><span><input name="isDcHidden" type="checkbox" defaultChecked /> Hide DC</span></label>
                <label className="campaignField"><span><input name="showSuccessToPlayer" type="checkbox" /> Show success to player</span></label>
                <button className="campaignDetailsPrimaryBtn" type="submit">Create requested roll</button>
              </form>
            )}
            <div className="campaignMaterialList">
              {requestedRolls.map((roll) => (
                <article key={roll.id} className="campaignMaterialCard">
                  <div className="campaignMaterialCard__top">
                    <strong>{roll.rollLabel}</strong>
                    <span className="campaignMemberBadge">{roll.status}</span>
                  </div>
                  <p>Target: {roll.characterName || roll.targetName || "-"}</p>
                  <p>Expression: {roll.rollExpression || "fallback"}</p>
                  {roll.dcVisible && roll.dc != null && <p>DC: {roll.dc}</p>}
                  {roll.resultTotal != null && <p>Result: {roll.resultTotal}{roll.success != null ? ` (${roll.success ? "SUCCESS" : "FAIL"})` : ""}</p>}
                  {isInProgress && !isGmView && roll.status === "PENDING" && (
                    <button className="campaignDetailsPrimaryBtn" type="button" onClick={() => handleFulfillRequestedRoll(roll.id)}>🎲 Roll</button>
                  )}
                  {isInProgress && isGmView && roll.status === "PENDING" && (
                    <button className="campaignDetailsDangerBtn" type="button" onClick={() => handleCancelRequestedRoll(roll.id)}>Cancel</button>
                  )}
                </article>
              ))}
              {requestedRolls.length === 0 && <p className="liveSessionPlaceholder">Brak requested rolls.</p>}
            </div>
          </section>

          <section className="campaignDetailsCard panel-soft">
            <h2 className="campaignDetailsCardTitle">Initiative Preview</h2>
            <p className="liveSessionPlaceholder">
              {isInProgress
                ? "Initiative preview placeholder (embedded panel in next stage)."
                : "Initiative preview is available only for active session (IN_PROGRESS)."}
            </p>
          </section>

          <section className="campaignDetailsCard panel-soft">
            <h2 className="campaignDetailsCardTitle">Session Roll History</h2>
            {recentRolls.length === 0 ? (
              <p className="liveSessionPlaceholder">No session rolls yet or history preview not available.</p>
            ) : (
              <ul className="liveSessionRollHistoryList">
                {recentRolls.map((roll) => (
                  <li key={roll.id || `${roll.createdAt}-${roll.expression}`}>
                    {roll.expression || "roll"} = {roll.total ?? "?"} ({roll.rollType || "GENERIC"})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="campaignDetailsCard panel-soft">
            <h2 className="campaignDetailsCardTitle">Role View</h2>
            {isGmView ? (
              <p className="liveSessionPlaceholder">GM controls (placeholder): full session management view.</p>
            ) : (
              <p className="liveSessionPlaceholder">Player view is read-only in this MVP foundation.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
