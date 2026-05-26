import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  cancelRequestedRoll,
  createRequestedRoll,
  finishCampaignSession,
  fulfillRequestedRoll,
  getCampaignById,
  getCampaignCharacters,
  getCampaignDiceRolls,
  getRequestedRolls,
  getSessionLiveState,
  listCampaignMembers,
  listCampaignSessions,
  startCampaignSession,
  updateSessionLiveState,
} from "../../api/campaigns";
import ImageUpload from "../../components/common/ImageUpload";
import "../../styles/live-session.css";

function sessionStatusLabel(status) {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "FINISHED") return "FINISHED";
  return "PLANNED";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function LiveSessionPage() {
  const { token } = useAuth();
  const { campaignId, sessionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaign, setCampaign] = useState(null);
  const [session, setSession] = useState(null);
  const [campaignCharacters, setCampaignCharacters] = useState([]);
  const [members, setMembers] = useState([]);
  const [recentRolls, setRecentRolls] = useState([]);
  const [liveState, setLiveState] = useState(null);
  const [savingScene, setSavingScene] = useState(false);
  const [notice, setNotice] = useState("");
  const [sessionActionBusy, setSessionActionBusy] = useState(false);
  const [requestedRolls, setRequestedRolls] = useState([]);
  const [requestedActionBusy, setRequestedActionBusy] = useState(false);
  const [showAdvancedRequested, setShowAdvancedRequested] = useState(false);
  const [showQuickRollPanel, setShowQuickRollPanel] = useState(false);
  const [targetMode, setTargetMode] = useState("ALL");
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sceneForm, setSceneForm] = useState({ sceneTitle: "", sceneImageUrl: "", sceneDescription: "" });

  const isGmView = Boolean(campaign?.owner);
  const myMember = members.find((member) => member?.self) || null;
  const myUserId = myMember?.id ?? null;

  const myCharacters = useMemo(() => {
    if (myUserId == null) return [];
    return campaignCharacters.filter((character) => Number(character?.userId) === Number(myUserId));
  }, [campaignCharacters, myUserId]);

  const myCharacterIds = useMemo(() => new Set(myCharacters.map((character) => Number(character.characterId))), [myCharacters]);
  const myCharacterNameSet = useMemo(() => new Set(myCharacters.map((character) => normalizeText(character.characterName))), [myCharacters]);

  const isPlanned = session?.status === "PLANNED";
  const isInProgress = session?.status === "IN_PROGRESS";
  const isFinished = session?.status === "FINISHED";

  const myRequestedRolls = useMemo(() => {
    if (isGmView) return requestedRolls;
    return requestedRolls.filter((roll) => {
      const targetUserId = Number(roll?.targetUserId);
      const targetCharacterId = Number(roll?.targetCharacterId);
      if (Number.isFinite(targetUserId) && myUserId != null && targetUserId === Number(myUserId)) return true;
      if (Number.isFinite(targetCharacterId) && myCharacterIds.has(targetCharacterId)) return true;
      return myCharacterNameSet.has(normalizeText(roll?.characterName));
    });
  }, [isGmView, requestedRolls, myUserId, myCharacterIds, myCharacterNameSet]);

  const rollStats = useMemo(() => {
    const totals = recentRolls.map((roll) => Number(roll?.total)).filter((value) => Number.isFinite(value));
    const perPlayerRaw = recentRolls.reduce((acc, roll) => {
      const key = roll?.rolledByUsername || `User #${roll?.rolledByUserId ?? "?"}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const perPlayer = Object.entries(perPlayerRaw).sort((a, b) => b[1] - a[1]);
    const maxCount = perPlayer.reduce((max, [, count]) => Math.max(max, count), 1);
    return {
      count: recentRolls.length,
      average: totals.length ? Math.round((totals.reduce((sum, n) => sum + n, 0) / totals.length) * 10) / 10 : null,
      highest: totals.length ? Math.max(...totals) : null,
      lowest: totals.length ? Math.min(...totals) : null,
      perPlayer,
      maxCount,
    };
  }, [recentRolls]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [campaignData, sessionsData, campaignCharactersData, membersData, rollsData, liveStateData, requestedRollsData] = await Promise.all([
          getCampaignById(token, campaignId),
          listCampaignSessions(token, campaignId),
          getCampaignCharacters(token, campaignId),
          listCampaignMembers(token, campaignId).catch(() => []),
          getCampaignDiceRolls(token, campaignId, { sessionId, limit: 200 }).catch(() => []),
          getSessionLiveState(token, campaignId, sessionId).catch(() => null),
          getRequestedRolls(token, campaignId, sessionId).catch(() => []),
        ]);
        const resolvedSession = Array.isArray(sessionsData)
          ? sessionsData.find((item) => String(item.id) === String(sessionId)) || null
          : null;
        setCampaign(campaignData);
        setSession(resolvedSession);
        setCampaignCharacters(Array.isArray(campaignCharactersData) ? campaignCharactersData : []);
        setMembers(Array.isArray(membersData) ? membersData : []);
        setRecentRolls(Array.isArray(rollsData) ? rollsData : []);
        setLiveState(liveStateData);
        setSceneForm({
          sceneTitle: liveStateData?.sceneTitle || "",
          sceneImageUrl: liveStateData?.sceneImageUrl || "",
          sceneDescription: liveStateData?.sceneDescription || "",
        });
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
    const [sessionsData, requested, rollsData, liveStateData] = await Promise.all([
      listCampaignSessions(token, campaignId),
      getRequestedRolls(token, campaignId, sessionId).catch(() => []),
      getCampaignDiceRolls(token, campaignId, { sessionId, limit: 200 }).catch(() => []),
      getSessionLiveState(token, campaignId, sessionId).catch(() => null),
    ]);

    const resolvedSession = Array.isArray(sessionsData)
      ? sessionsData.find((item) => String(item.id) === String(sessionId)) || null
      : null;
    setSession(resolvedSession);
    setRequestedRolls(Array.isArray(requested) ? requested : []);
    setRecentRolls(Array.isArray(rollsData) ? rollsData : []);
    setLiveState(liveStateData || null);
  }

  async function handleStartSession() {
    setSessionActionBusy(true);
    setError("");
    setNotice("");
    try {
      await startCampaignSession(token, campaignId, sessionId);
      await reloadSessionData();
      setNotice("Sesja rozpoczeta.");
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
      setNotice("Sesja zakonczona.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie zakonczyc sesji.");
    } finally {
      setSessionActionBusy(false);
    }
  }

  function toggleSelected(setter, value) {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  }

  async function handleCreateRequestedRoll(event) {
    event.preventDefault();
    if (!isInProgress || !isGmView) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      targetMode,
      targetCharacterIds: targetMode === "CHARACTER" ? selectedCharacterIds : [],
      targetUserIds: targetMode === "USER" ? selectedUserIds : [],
      rollLabel: String(formData.get("rollLabel") || "").trim(),
      rollType: String(formData.get("rollType") || "SKILL").trim(),
      rollExpression: String(formData.get("rollExpression") || "").trim() || null,
      dc: String(formData.get("dc") || "").trim() ? Number(formData.get("dc")) : null,
      abilityKey: String(formData.get("abilityKey") || "").trim() || null,
      skillKey: String(formData.get("skillKey") || "").trim() || null,
      isDcHidden: formData.get("isDcHidden") === "on",
      showSuccessToPlayer: formData.get("showSuccessToPlayer") === "on",
    };

    if (targetMode === "CHARACTER" && payload.targetCharacterIds.length === 0) {
      setError("Wybierz co najmniej jedna postac.");
      return;
    }
    if (targetMode === "USER" && payload.targetUserIds.length === 0) {
      setError("Wybierz co najmniej jednego gracza.");
      return;
    }

    setError("");
    setNotice("");
    setRequestedActionBusy(true);
    try {
      await createRequestedRoll(token, campaignId, sessionId, payload);
      await reloadSessionData();
      setNotice("Rzut zostal wyslany do graczy.");
      setShowQuickRollPanel(false);
      setTargetMode("ALL");
      setSelectedCharacterIds([]);
      setSelectedUserIds([]);
      event.currentTarget.reset();
    } catch (err) {
      setError(err?.message || "Nie udalo sie utworzyc requested roll.");
    } finally {
      setRequestedActionBusy(false);
    }
  }

  async function handleFulfillRequestedRoll(requestId) {
    setError("");
    setNotice("");
    setRequestedActionBusy(true);
    try {
      await fulfillRequestedRoll(token, campaignId, sessionId, requestId, {});
      await reloadSessionData();
      setNotice("Requested roll wykonany.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie wykonac requested roll.");
    } finally {
      setRequestedActionBusy(false);
    }
  }

  async function handleCancelRequestedRoll(requestId) {
    setError("");
    setNotice("");
    setRequestedActionBusy(true);
    try {
      await cancelRequestedRoll(token, campaignId, sessionId, requestId);
      await reloadSessionData();
      setNotice("Requested roll anulowany.");
    } catch (err) {
      setError(err?.message || "Nie udalo sie anulowac requested roll.");
    } finally {
      setRequestedActionBusy(false);
    }
  }

  return (
    <div className="page liveSessionPage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">Live Session Room</span>
          <h1 className="pageTitle">{campaign?.title || "Live session"}</h1>
          <p className="pageSubtitle">
            Sesja: {session?.title || `#${sessionId}`} ({sessionStatusLabel(session?.status)})
          </p>
          {isPlanned && <p className="campaignDetailsEmpty">Sesja jest zaplanowana i jeszcze sie nie rozpoczela.</p>}
          {isFinished && <p className="campaignDetailsEmpty">Sesja zakonczona. Widok tylko do odczytu.</p>}
        </div>
        <div>
          <Link className="campaignDetailsGhostBtn" to={`/campaigns/${campaignId}`}>Wroc do kampanii</Link>
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
          <section className="campaignDetailsCard panel-soft liveSessionScenePanel">
            <h2 className="campaignDetailsCardTitle">{isGmView ? "Scene Panel" : "Aktualna scena"}</h2>
            {isGmView && !isFinished ? (
              <form
                className="liveSessionSceneForm"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const payload = {
                    sceneTitle: String(sceneForm.sceneTitle || "").trim(),
                    sceneImageUrl: String(sceneForm.sceneImageUrl || "").trim(),
                    sceneDescription: String(sceneForm.sceneDescription || "").trim(),
                    activeEncounterId: null,
                  };
                  setSavingScene(true);
                  setNotice("");
                  setError("");
                  try {
                    const updated = await updateSessionLiveState(token, campaignId, sessionId, payload);
                    setLiveState(updated);
                    setSceneForm({
                      sceneTitle: updated?.sceneTitle || "",
                      sceneImageUrl: updated?.sceneImageUrl || "",
                      sceneDescription: updated?.sceneDescription || "",
                    });
                    setNotice("Scena zapisana.");
                  } catch (err) {
                    setError(err?.message || "Nie udalo sie zapisac sceny.");
                  } finally {
                    setSavingScene(false);
                  }
                }}
              >
                <label className="campaignField">
                  <span>Tytul sceny</span>
                  <input
                    name="sceneTitle"
                    value={sceneForm.sceneTitle}
                    onChange={(e) => setSceneForm((prev) => ({ ...prev, sceneTitle: e.target.value }))}
                    maxLength={160}
                  />
                </label>
                <label className="campaignField">
                  <span>URL obrazu sceny</span>
                  <input
                    name="sceneImageUrl"
                    value={sceneForm.sceneImageUrl}
                    onChange={(e) => setSceneForm((prev) => ({ ...prev, sceneImageUrl: e.target.value }))}
                  />
                </label>
                <ImageUpload
                  label="Wgraj obraz sceny"
                  value={sceneForm.sceneImageUrl}
                  onChange={(url) => setSceneForm((prev) => ({ ...prev, sceneImageUrl: url }))}
                  onRemove={() => setSceneForm((prev) => ({ ...prev, sceneImageUrl: "" }))}
                  previewAlt="Obraz sceny"
                />
                <label className="campaignField">
                  <span>Opis sceny</span>
                  <textarea
                    name="sceneDescription"
                    value={sceneForm.sceneDescription}
                    onChange={(e) => setSceneForm((prev) => ({ ...prev, sceneDescription: e.target.value }))}
                    rows={4}
                    maxLength={5000}
                  />
                </label>
                <button type="submit" className="campaignDetailsPrimaryBtn" disabled={savingScene}>
                  Zapisz scene
                </button>
              </form>
            ) : (
              <div className="liveSessionSceneReadonly">
                <h3>{liveState?.sceneTitle || "Tytul sceny nie jest ustawiony"}</h3>
                {liveState?.sceneImageUrl ? (
                  <img src={liveState.sceneImageUrl} alt={liveState.sceneTitle || "Scene image"} className="liveSessionSceneImage" />
                ) : (
                  <div className="liveSessionSceneImagePlaceholder">Brak obrazu sceny</div>
                )}
                <p>{liveState?.sceneDescription || "Opis sceny nie jest jeszcze dostepny."}</p>
              </div>
            )}
          </section>

          {isGmView ? (
            <section className="campaignDetailsCard panel-soft liveSessionPartyPanel">
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
                        <span>Gracz: {character.ownerDisplayName || character.ownerUsername || character.role || "-"}</span>
                        <span>User: {character.userId ?? "-"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="campaignDetailsCard panel-soft liveSessionPartyPanel">
              <h2 className="campaignDetailsCardTitle">Moja postac</h2>
              {myCharacters.length === 0 ? (
                <div className="campaignDetailsEmpty">Nie masz przypisanej postaci w tej kampanii.</div>
              ) : (
                <div className="campaignMaterialList">
                  {myCharacters.map((character) => (
                    <article key={character.characterId} className="campaignMaterialCard liveSessionCharacterCard">
                      {character.portraitUrl ? (
                        <img src={character.portraitUrl} alt={character.characterName || "Postac"} className="liveSessionCharacterAvatar" />
                      ) : (
                        <div className="liveSessionCharacterAvatarPlaceholder">Brak avatara</div>
                      )}
                      <div className="campaignMaterialMeta">
                        <strong>{character.characterName || "Postac"}</strong>
                        <span>Poziom: {character.level ?? "-"}</span>
                        <span>System: {character.systemCode || "-"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="campaignDetailsCard panel-soft liveSessionRequestsPanel">
            <h2 className="campaignDetailsCardTitle">{isGmView ? "Requested Rolls" : "Moje rzuty"}</h2>
            {isPlanned && <p className="liveSessionPlaceholder">Rzuty beda dostepne po rozpoczeciu sesji przez MG.</p>}
            {isFinished && <p className="liveSessionPlaceholder">Sesja zakonczona. Lista rzutow pozostaje tylko do odczytu.</p>}

            {isInProgress && isGmView && (
              <>
                <button
                  className="campaignDetailsPrimaryBtn"
                  type="button"
                  onClick={() => setShowQuickRollPanel((prev) => !prev)}
                >
                  {showQuickRollPanel ? "Zamknij panel rzutu" : "Zadaj rzut"}
                </button>

                {showQuickRollPanel && (
                  <form className="campaignFormCard liveSessionQuickRollPanel" onSubmit={handleCreateRequestedRoll}>
                    <label className="campaignField"><span>Etykieta rzutu</span><input name="rollLabel" maxLength={160} required /></label>
                    <label className="campaignField"><span>Trudnosc / DC</span><input name="dc" type="number" min="0" /></label>
                    <label className="campaignField"><span>Typ rzutu</span><input name="rollType" defaultValue="SKILL" maxLength={40} /></label>
                    <label className="campaignField"><span>Wyrazenie rzutu</span><input name="rollExpression" defaultValue={campaign?.systemCode === "dnd5e" ? "1d20" : ""} maxLength={120} /></label>
                    <label className="campaignField">
                      <span>Do kogo?</span>
                      <select value={targetMode} onChange={(event) => setTargetMode(event.target.value)}>
                        <option value="ALL">Wszyscy</option>
                        <option value="CHARACTER">Wybrane postacie</option>
                        <option value="USER">Wybrani gracze</option>
                      </select>
                    </label>

                    {targetMode === "CHARACTER" && (
                      <div className="liveSessionTargetList" aria-label="Lista postaci">
                        {campaignCharacters.map((character) => (
                          <label key={character.characterId} className="liveSessionTargetItem">
                            <input
                              type="checkbox"
                              checked={selectedCharacterIds.includes(Number(character.characterId))}
                              onChange={() => toggleSelected(setSelectedCharacterIds, Number(character.characterId))}
                            />
                            <span>{character.characterName || `Postac #${character.characterId}`}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {targetMode === "USER" && (
                      <div className="liveSessionTargetList" aria-label="Lista graczy">
                        {members.map((member) => (
                          <label key={member.id} className="liveSessionTargetItem">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(Number(member.id))}
                              onChange={() => toggleSelected(setSelectedUserIds, Number(member.id))}
                            />
                            <span>{member.displayName || member.username || `User #${member.id}`}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    <button className="campaignDetailsGhostBtn" type="button" onClick={() => setShowAdvancedRequested((prev) => !prev)}>
                      {showAdvancedRequested ? "Ukryj opcje zaawansowane" : "Pokaz opcje zaawansowane"}
                    </button>

                    {showAdvancedRequested ? (
                      <div className="campaignFormCard">
                        <label className="campaignField"><span>ability key</span><input name="abilityKey" maxLength={80} /></label>
                        <label className="campaignField"><span>skill key</span><input name="skillKey" maxLength={80} /></label>
                        <label className="campaignField"><span><input name="isDcHidden" type="checkbox" defaultChecked /> ukryj DC</span></label>
                        <label className="campaignField"><span><input name="showSuccessToPlayer" type="checkbox" /> pokaz sukces graczowi</span></label>
                        <label className="campaignField"><span>targetCharacterIds (fallback)</span><input value={selectedCharacterIds.join(",")} disabled /></label>
                        <label className="campaignField"><span>targetUserIds (fallback)</span><input value={selectedUserIds.join(",")} disabled /></label>
                      </div>
                    ) : null}

                    <button className="campaignDetailsPrimaryBtn" type="submit" disabled={requestedActionBusy}>
                      Wyslij do graczy
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="campaignMaterialList">
              {myRequestedRolls.map((roll) => (
                <article key={roll.id} className="campaignMaterialCard">
                  <div className="campaignMaterialCard__top">
                    <strong>{roll.rollLabel}</strong>
                    <span className="campaignMemberBadge">{roll.status}</span>
                  </div>
                  {isGmView ? <p>Cel: {roll.characterName || roll.targetName || "-"}</p> : null}
                  {roll.dcVisible && roll.dc != null && <p>Trudnosc: {roll.dc}</p>}
                  {roll.resultTotal != null && <p>Wynik: {roll.resultTotal}{roll.success != null ? ` (${roll.success ? "SUCCESS" : "FAIL"})` : ""}</p>}

                  {isInProgress && !isGmView && roll.status === "PENDING" && (
                    <button className="campaignDetailsPrimaryBtn" type="button" disabled={requestedActionBusy} onClick={() => handleFulfillRequestedRoll(roll.id)}>Wykonaj rzut</button>
                  )}
                  {isInProgress && isGmView && roll.status === "PENDING" && (
                    <button className="campaignDetailsDangerBtn" type="button" disabled={requestedActionBusy} onClick={() => handleCancelRequestedRoll(roll.id)}>Anuluj</button>
                  )}
                </article>
              ))}
              {myRequestedRolls.length === 0 && <p className="liveSessionPlaceholder">Brak requested rolls.</p>}
            </div>
          </section>

          <section className="campaignDetailsCard panel-soft liveSessionHistoryPanel">
            <h2 className="campaignDetailsCardTitle">Historia rzutow</h2>
            {recentRolls.length === 0 ? (
              <p className="liveSessionPlaceholder">Brak rzutow sesji albo podglad historii jest niedostepny.</p>
            ) : (
              <div className="campaignMaterialList">
                {recentRolls.map((roll) => (
                  <article key={roll.id || `${roll.createdAt}-${roll.rollExpression}`} className="campaignMaterialCard">
                    <strong>{roll.rollLabel || roll.rollType || "Rzut"}</strong>
                    <p>Rzucal: {roll.rolledByUsername || `User #${roll.rolledByUserId ?? "-"}`}</p>
                    <p>Postac: {roll.characterName || roll.characterId || "-"}</p>
                    <p>Wynik: {roll.total ?? "?"}</p>
                    <p>Data: {formatDateTime(roll.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="campaignDetailsCard panel-soft liveSessionStatsPanel">
            <h2 className="campaignDetailsCardTitle">Statystyki rzutow</h2>
            <div className="liveSessionStatsGrid">
              <p>Liczba rzutow: <strong>{rollStats.count}</strong></p>
              <p>Sredni wynik: <strong>{rollStats.average ?? "-"}</strong></p>
              <p>Najwyzszy wynik: <strong>{rollStats.highest ?? "-"}</strong></p>
              <p>Najnizszy wynik: <strong>{rollStats.lowest ?? "-"}</strong></p>
            </div>
            {rollStats.perPlayer.length === 0 ? (
              <p className="liveSessionPlaceholder">Brak danych per gracz.</p>
            ) : (
              <div className="liveSessionBars">
                {rollStats.perPlayer.map(([name, count]) => (
                  <div key={name} className="liveSessionBarRow">
                    <span>{name}</span>
                    <div className="liveSessionBarTrack">
                      <div className="liveSessionBarFill" style={{ width: `${Math.max(8, Math.round((count / rollStats.maxCount) * 100))}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!isGmView && isFinished && (
            <section className="campaignDetailsCard panel-soft">
              <h2 className="campaignDetailsCardTitle">Po sesji</h2>
              <p className="liveSessionPlaceholder">Sesja zostala zakonczona. Mozesz dodac notatki po sesji.</p>
              <Link className="campaignDetailsPrimaryBtn" to={`/campaigns/${campaignId}`}>Dodaj notatki po sesji</Link>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
