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
  getSessionAttendance,
  getSessionLiveState,
  listCampaignMembers,
  listCampaignSessions,
  startCampaignSession,
  updateSessionLiveState,
} from "../../api/campaigns";
import ImageUpload from "../../components/common/ImageUpload";
import "../../styles/live-session.css";

const SCENE_LIBRARY_VERSION = 1;
const EMPTY_SCENE_DRAFT = {
  id: "",
  title: "",
  description: "",
  imageUrl: "",
  location: "",
  mood: "",
  visibleToPlayers: false,
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function formatClock(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function getSessionStartTimestamp(session) {
  const raw = firstDefined(session?.startedAt, session?.started_at, session?.startTime, session?.scheduledFor, session?.createdAt);
  const timestamp = raw ? new Date(raw).getTime() : Date.now();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function displayNameFromCharacter(character) {
  return firstDefined(character?.characterName, character?.name, "Postać");
}

function memberDisplayName(member) {
  return firstDefined(member?.displayName, member?.username, member?.handle, member?.id ? `Użytkownik #${member.id}` : "Gracz");
}

function archetypeFromCharacter(character) {
  const level = character?.level != null ? ` ${character.level}` : "";
  const archetype = firstDefined(
    character?.className,
    character?.characterClass,
    character?.class,
    character?.profession,
    character?.archetype,
    character?.raceName,
    character?.systemCode,
    "Postać"
  );
  return `${archetype}${level}`;
}

function safeImageUrl(value) {
  return String(value || "").trim();
}

function sceneStorageKey(campaignId, sessionId) {
  return `ttrpg.liveScenes.v${SCENE_LIBRARY_VERSION}.${campaignId}.${sessionId}`;
}

function readSceneLibrary(campaignId, sessionId) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(sceneStorageKey(campaignId, sessionId)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((scene) => scene && typeof scene === "object") : [];
  } catch {
    return [];
  }
}

function writeSceneLibrary(campaignId, sessionId, scenes) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sceneStorageKey(campaignId, sessionId), JSON.stringify(scenes));
}

function makeSceneId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `scene-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sceneHasContent(scene) {
  return Boolean(firstDefined(scene?.title, scene?.sceneTitle, scene?.description, scene?.sceneDescription, scene?.imageUrl, scene?.sceneImageUrl));
}

function sceneFromLiveState(liveState) {
  if (!sceneHasContent(liveState)) return null;
  return {
    id: "live-state",
    title: firstDefined(liveState?.sceneTitle, ""),
    description: firstDefined(liveState?.sceneDescription, ""),
    imageUrl: safeImageUrl(liveState?.sceneImageUrl),
    location: firstDefined(liveState?.location, ""),
    mood: firstDefined(liveState?.mood, ""),
    visibleToPlayers: true,
    updatedAt: liveState?.updatedAt || new Date().toISOString(),
    fromLiveState: true,
  };
}

function normalizeSceneDraft(draft) {
  return {
    id: draft?.id || makeSceneId(),
    title: String(draft?.title || "").trim(),
    description: String(draft?.description || "").trim(),
    imageUrl: safeImageUrl(draft?.imageUrl),
    location: String(draft?.location || "").trim(),
    mood: String(draft?.mood || "").trim(),
    visibleToPlayers: Boolean(draft?.visibleToPlayers),
    updatedAt: new Date().toISOString(),
  };
}

function scenePayload(scene) {
  return {
    sceneTitle: String(scene?.title || "").trim(),
    sceneImageUrl: safeImageUrl(scene?.imageUrl),
    sceneDescription: String(scene?.description || "").trim(),
    activeEncounterId: null,
  };
}

function mergeLiveSceneIntoLibrary(campaignId, sessionId, scenes, liveState) {
  const liveScene = sceneFromLiveState(liveState);
  if (!liveScene) return { scenes, activeSceneId: "" };
  const match = scenes.find((scene) =>
    normalizeText(scene.title) === normalizeText(liveScene.title)
    && safeImageUrl(scene.imageUrl) === safeImageUrl(liveScene.imageUrl)
    && normalizeText(scene.description) === normalizeText(liveScene.description)
  );
  if (match) return { scenes, activeSceneId: match.id };
  const imported = { ...liveScene, id: makeSceneId() };
  const nextScenes = [imported, ...scenes];
  writeSceneLibrary(campaignId, sessionId, nextScenes);
  return { scenes: nextScenes, activeSceneId: imported.id };
}

function requestedRollResult(roll) {
  const total = Number(roll?.resultTotal ?? roll?.total);
  return Number.isFinite(total) ? total : null;
}

function requestedRollResolved(roll) {
  return Boolean((roll?.status && roll.status !== "PENDING") || roll?.fulfilledRollId != null || requestedRollResult(roll) != null);
}

function rollStatusLabel(roll) {
  if (roll?.success === true) return "Sukces";
  if (roll?.success === false) return "Porażka";
  if (roll?.status === "FULFILLED") return "Wykonany";
  if (roll?.status === "CANCELLED") return "Anulowany";
  return "Wynik";
}

function attendanceKind(status) {
  const value = String(status || "").toUpperCase();
  if (["AVAILABLE", "YES", "PRESENT", "ONLINE"].includes(value)) return "online";
  if (["MAYBE", "PENDING"].includes(value)) return "pending";
  if (["UNAVAILABLE", "NO", "ABSENT", "OFFLINE"].includes(value)) return "offline";
  return "unknown";
}

function Avatar({ name, src, size = "md" }) {
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  return src ? (
    <img className={`liveSessionAvatar liveSessionAvatar--${size}`} src={src} alt={name || "Avatar"} onError={(event) => { event.currentTarget.style.display = "none"; }} />
  ) : (
    <span className={`liveSessionAvatar liveSessionAvatar--${size}`} aria-hidden="true">{initial}</span>
  );
}

function Icon({ name }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "edit") return <svg {...common}><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>;
  if (name === "swap") return <svg {...common}><path d="M7 7h12l-3-3" /><path d="M17 17H5l3 3" /></svg>;
  if (name === "eye") return <svg {...common}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
  if (name === "dice") return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M12 12 4.5 7.8" /><path d="M12 12v8.5" /><path d="m12 12 7.5-4.2" /></svg>;
  if (name === "sword") return <svg {...common}><path d="M14.5 5.5 18 2l4 4-3.5 3.5" /><path d="M13 7 3 17v4h4L17 11" /><path d="m6 14 4 4" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 5 6v5c0 4.5 3 7.7 7 10 4-2.3 7-5.5 7-10V6l-7-3Z" /><path d="M12 7v9" /></svg>;
  if (name === "more") return <svg {...common}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>;
  if (name === "expand") return <svg {...common}><path d="M8 3H3v5" /><path d="M16 3h5v5" /><path d="M21 16v5h-5" /><path d="M3 16v5h5" /></svg>;
  if (name === "pin") return <svg {...common}><path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2" /></svg>;
  if (name === "mood") return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M9 15c1.7 1.2 4.3 1.2 6 0" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>;
  return null;
}

function LiveSessionHeader({ campaign, session, isGmView, isPlanned, isInProgress, isFinished, duration, campaignId, busy, onStart, onFinish }) {
  const campaignTitle = firstDefined(campaign?.title, campaign?.name, "Kampania");
  const sessionTitle = firstDefined(session?.title, session?.name, session?.number != null ? `Sesja ${session.number}` : "", session?.id ? `Sesja ${session.id}` : "", "Sesja aktywna");
  const gmName = firstDefined(campaign?.ownerDisplayName, campaign?.ownerUsername, campaign?.gmName, "MG");

  return (
    <section className="liveSessionTopbar" aria-label="Status sesji">
      <div className="liveSessionTopbar__main">
        <span className={`liveSessionStatusPill ${isInProgress ? "is-live" : ""}`}><span />{isInProgress ? "Sesja na żywo" : isFinished ? "Sesja zakończona" : "Sesja zaplanowana"}</span>
        <strong>{campaignTitle}</strong>
        <span className="liveSessionDivider" />
        <span>{sessionTitle}</span>
        <span className="liveSessionTimeBadge"><Icon name="clock" />{duration}</span>
        <span className="liveSessionGmBadge">MG: {gmName}</span>
      </div>
      <div className="liveSessionTopbar__actions">
        <Link className="campaignDetailsGhostBtn liveSessionHeaderButton" to={`/campaigns/${campaignId}`}>Wróć do kampanii</Link>
        {isPlanned && isGmView && (
          <button className="campaignDetailsPrimaryBtn liveSessionHeaderButton" type="button" onClick={onStart} disabled={busy}>Rozpocznij sesję</button>
        )}
        {isInProgress && isGmView && (
          <button className="campaignDetailsDangerBtn liveSessionHeaderButton" type="button" onClick={onFinish} disabled={busy}>Zakończ sesję</button>
        )}
      </div>
    </section>
  );
}

function ScenePanel({ isGmView, isFinished, activeScene, playerCanSeeScene, onOpenEdit, onOpenChange, onOpenAdd, onPublish, publishing }) {
  const visibleScene = isGmView || playerCanSeeScene ? activeScene : null;
  const hasScene = sceneHasContent(visibleScene);
  const sceneTitle = firstDefined(visibleScene?.title, isGmView ? "Brak aktywnej sceny" : "Scena niedostępna");
  const sceneDescription = firstDefined(
    visibleScene?.description,
    isGmView ? "Dodaj opis sceny, aby gracze mieli kontekst aktualnej lokacji." : "MG nie udostępnił jeszcze aktywnej sceny."
  );
  const imageUrl = safeImageUrl(visibleScene?.imageUrl);
  const canPublish = isGmView && !isFinished && sceneHasContent(activeScene) && !activeScene?.visibleToPlayers;

  return (
    <section className="liveSessionPanel liveSessionScenePanel" aria-labelledby="scene-panel-title">
      <div className="liveSessionPanelHeader">
        <h2 id="scene-panel-title">Panel sceny</h2>
        {hasScene ? <span className="liveSessionSoftBadge">Aktywna scena</span> : <span className="liveSessionSoftBadge is-muted">Brak sceny</span>}
      </div>

      <div className="liveSessionSceneMedia">
        {imageUrl ? (
          <img src={imageUrl} alt={sceneTitle} onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="liveSessionScenePlaceholder">
            <strong>{isGmView ? "Dodaj scenę" : "Scena nie została udostępniona"}</strong>
            <span>{isGmView ? "Dodaj obraz sceny, mapę albo ilustrację lokacji." : "MG nie udostępnił jeszcze aktywnej sceny."}</span>
          </div>
        )}
        {imageUrl ? <button className="liveSessionIconButton" type="button" aria-label="Powiększ scenę"><Icon name="expand" /></button> : null}
      </div>

      <div className="liveSessionSceneBody">
        <div className="liveSessionSceneCopy">
          <div className="liveSessionSceneTitleLine">
            <h3>{sceneTitle}</h3>
            {hasScene ? <span className="liveSessionActiveBadge">Aktywna scena</span> : null}
            {activeScene?.visibleToPlayers ? <span className="liveSessionVisibleBadge">Widoczna dla graczy</span> : null}
          </div>
          <p>{sceneDescription}</p>
        </div>
        {(visibleScene?.location || visibleScene?.mood) ? (
          <div className="liveSessionSceneMeta" aria-label="Kontekst sceny">
            {visibleScene.location ? <div><Icon name="pin" /><span>Lokalizacja</span><strong>{visibleScene.location}</strong></div> : null}
            {visibleScene.mood ? <div><Icon name="mood" /><span>Nastrój</span><strong>{visibleScene.mood}</strong></div> : null}
          </div>
        ) : null}
      </div>

      {isGmView ? (
        <div className="liveSessionSceneActions">
          <button className="campaignDetailsPrimaryBtn" type="button" onClick={onOpenEdit} disabled={isFinished || !sceneHasContent(activeScene)}><Icon name="edit" /> Edytuj scenę</button>
          <button className="campaignDetailsGhostBtn" type="button" onClick={onOpenChange} disabled={isFinished}><Icon name="swap" /> Zmień scenę</button>
          <button className="campaignDetailsGhostBtn" type="button" onClick={onOpenAdd} disabled={isFinished}><Icon name="plus" /> Dodaj scenę</button>
          <button className="campaignDetailsGhostBtn" type="button" onClick={onPublish} disabled={!canPublish || publishing}><Icon name="eye" /> {activeScene?.visibleToPlayers ? "Widoczna dla graczy" : "Pokaż graczom"}</button>
        </div>
      ) : null}
    </section>
  );
}

function PlayerStrip({ characters, members, attendance }) {
  const memberById = useMemo(() => new Map(members.map((member) => [Number(member.id), member])), [members]);
  const attendanceByUserId = useMemo(() => new Map(attendance.map((item) => [Number(item.userId), item])), [attendance]);
  const visible = characters.slice(0, 8);
  const knownStatuses = visible.map((character) => attendanceKind(attendanceByUserId.get(Number(character?.userId))?.status));
  const onlineCount = knownStatuses.filter((status) => status === "online").length;
  const knownCount = knownStatuses.filter((status) => status !== "unknown").length;

  return (
    <section className="liveSessionPanel liveSessionPlayersPanel" aria-labelledby="players-title">
      <div className="liveSessionPanelHeader">
        <h2 id="players-title">Gracze / Postacie</h2>
        {visible.length ? (
          knownCount ? <span className="liveSessionOnlineCount"><span />{onlineCount} z {visible.length} online</span> : <span className="liveSessionOnlineCount is-muted"><span />Obecność nieznana</span>
        ) : null}
      </div>
      {visible.length ? (
        <div className="liveSessionPlayerStrip">
          {visible.map((character) => {
            const name = displayNameFromCharacter(character);
            const member = memberById.get(Number(character?.userId));
            const status = attendanceKind(attendanceByUserId.get(Number(character?.userId))?.status);
            return (
              <article className="liveSessionPlayerCard" key={character.characterId || name}>
                <div className="liveSessionAvatarWrap"><Avatar name={name} src={character.portraitUrl} /><span className={`liveSessionOnlineDot liveSessionOnlineDot--${status}`} /></div>
                <div>
                  <span>{memberDisplayName(member)}</span>
                  <strong>{name}</strong>
                  <small>{archetypeFromCharacter(character)}</small>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="liveSessionPlaceholder">Brak przypisanych postaci w kampanii.</p>
      )}
    </section>
  );
}

function RollHistoryPanel({ rolls }) {
  const [tab, setTab] = useState("history");
  const recent = rolls.slice(0, 4);
  const totals = rolls.map(requestedRollResult).filter((value) => value != null);
  const average = totals.length ? Math.round((totals.reduce((sum, value) => sum + value, 0) / totals.length) * 10) / 10 : null;

  return (
    <section className="liveSessionPanel liveSessionHistoryPanel" aria-labelledby="roll-history-title">
      <h2 id="roll-history-title">Historia rzutów</h2>
      <div className="liveSessionTabs" role="tablist" aria-label="Widok historii rzutów">
        <button className={tab === "history" ? "is-active" : ""} type="button" onClick={() => setTab("history")}>Historia</button>
        <button className={tab === "analysis" ? "is-active" : ""} type="button" onClick={() => setTab("analysis")}>Analiza</button>
      </div>
      {tab === "history" ? (
        recent.length ? (
          <div className="liveSessionRollList">
            {recent.map((roll) => {
              const actor = firstDefined(roll.characterName, roll.targetName, "Gracz");
              const result = requestedRollResult(roll);
              return (
                <article className="liveSessionRollRow" key={roll.id || `${roll.resolvedAt}-${roll.rollLabel}`}>
                  <Avatar name={actor} size="sm" />
                  <div>
                    <strong>{actor}</strong>
                    <span>{firstDefined(roll.rollLabel, roll.skillKey, roll.abilityKey, roll.rollType, "Rzut")}</span>
                  </div>
                  <div className="liveSessionRollResult"><strong>{result ?? "-"}</strong><span>{rollStatusLabel(roll)}</span></div>
                  <time>{formatClock(firstDefined(roll.resolvedAt, roll.createdAt))}</time>
                </article>
              );
            })}
          </div>
        ) : <p className="liveSessionPlaceholder">Historia pojawi się po pierwszym rzucie w tej sesji.</p>
      ) : (
        totals.length ? (
          <div className="liveSessionMiniStats">
            <span>Liczba rzutów<strong>{totals.length}</strong></span>
            <span>Średni wynik<strong>{average}</strong></span>
            <span>Najwyższy<strong>{Math.max(...totals)}</strong></span>
            <span>Najniższy<strong>{Math.min(...totals)}</strong></span>
          </div>
        ) : <p className="liveSessionPlaceholder">Brak danych do analizy.</p>
      )}
      <Link className="liveSessionTextLink" to="/dice">Pokaż pełną historię rzutów →</Link>
    </section>
  );
}

function RollAnalysisPanel({ stats }) {
  if (!stats.count) {
    return (
      <section className="liveSessionPanel liveSessionAnalysisPanel" aria-labelledby="roll-analysis-title">
        <h2 id="roll-analysis-title">Analiza rzutów (sesja)</h2>
        <div className="liveSessionEmptyDonut" aria-hidden="true"><span /></div>
        <p className="liveSessionPlaceholder">Brak danych do analizy.</p>
      </section>
    );
  }

  const successPercent = (stats.success / stats.count) * 100;
  const unknownPercent = ((stats.success + stats.unknown) / stats.count) * 100;
  const failedPercent = ((stats.success + stats.unknown + stats.failed) / stats.count) * 100;
  const chartStyle = {
    "--success": `${successPercent}%`,
    "--unknown": `${unknownPercent}%`,
    "--failed": `${failedPercent}%`,
  };

  return (
    <section className="liveSessionPanel liveSessionAnalysisPanel" aria-labelledby="roll-analysis-title">
      <h2 id="roll-analysis-title">Analiza rzutów (sesja)</h2>
      <div className="liveSessionAnalysisBody">
        <div className="liveSessionDonut" style={chartStyle} aria-label={`Łącznie ${stats.count} rzutów`}><span>Łącznie<strong>{stats.count}</strong><em>rzuty</em></span></div>
        <div className="liveSessionLegend">
          <span><i className="is-success" />Udane<strong>{stats.success}</strong></span>
          <span><i className="is-partial" />Bez ST / nieokreślone<strong>{stats.unknown}</strong></span>
          <span><i className="is-failed" />Nieudane<strong>{stats.failed}</strong></span>
        </div>
      </div>
      <div className="liveSessionAnalysisStats">
        <span>Śr. wynik: <strong>{stats.average ?? "-"}</strong></span>
        <span>Najwyższy: <strong>{stats.highest ?? "-"}</strong></span>
        <span>Najniższy: <strong>{stats.lowest ?? "-"}</strong></span>
      </div>
    </section>
  );
}

function RequiredRollsPanel({ isGmView, isInProgress, isPlanned, isFinished, rolls, busy, onFulfill, onCancel, showQuickRollPanel, setShowQuickRollPanel, form }) {
  const pendingCount = rolls.filter((roll) => roll.status === "PENDING").length;

  return (
    <section className="liveSessionPanel liveSessionRequestsPanel" aria-labelledby="required-rolls-title">
      <div className="liveSessionPanelHeader">
        <h2 id="required-rolls-title"><span className="liveSessionWarningIcon">!</span> Wymagane rzuty</h2>
        {isInProgress && isGmView && <button className="campaignDetailsGhostBtn" type="button" onClick={() => setShowQuickRollPanel((value) => !value)}>{showQuickRollPanel ? "Zamknij formularz" : "Zadaj rzut"}</button>}
      </div>

      {isPlanned && <p className="liveSessionPlaceholder">Rzuty będą dostępne po rozpoczęciu sesji przez MG.</p>}
      {isFinished && <p className="liveSessionPlaceholder">Sesja zakończona. Lista rzutów pozostaje tylko do odczytu.</p>}

      {!isPlanned && rolls.length ? (
        <div className="liveSessionRequiredRollList">
          {rolls.map((roll) => {
            const isPending = roll.status === "PENDING";
            return (
              <article className="liveSessionRequiredRollCard" key={roll.id}>
                <div><strong>{firstDefined(roll.characterName, roll.targetName, "Gracz")}</strong><span>{firstDefined(roll.rollLabel, "Rzut wymagany przez MG")}</span></div>
                <div><span>Atrybut / umiejętność</span><strong>{firstDefined(roll.skillKey, roll.abilityKey, roll.rollType, "Rzut")}</strong></div>
                <div><span>ST</span><strong>{roll.dc != null ? `DC ${roll.dc}` : "Brak"}</strong></div>
                <div><span>Status</span><strong>{isPending ? "Oczekuje" : rollStatusLabel(roll)}</strong></div>
                {isGmView ? (
                  <button className="campaignDetailsDangerBtn" type="button" disabled={busy || !isPending} onClick={() => onCancel(roll.id)}>Anuluj</button>
                ) : (
                  <button className="campaignDetailsPrimaryBtn" type="button" disabled={busy || !isPending} onClick={() => onFulfill(roll.id)}>Wykonaj rzut</button>
                )}
              </article>
            );
          })}
        </div>
      ) : !isPlanned && !isFinished ? (
        <p className="liveSessionPlaceholder">Brak wymaganych rzutów.</p>
      ) : null}

      <small className="liveSessionRequestHint">{pendingCount} oczekujący rzut • {isGmView ? "MG może zadać nowy rzut z formularza." : "Kliknij „Wykonaj rzut”, aby przejść do rzutu."}</small>
      {showQuickRollPanel && form}
    </section>
  );
}

function QuickActionsPanel({ isGmView, isInProgress, onQuickRoll }) {
  const gmActions = [
    ["dice", "Rzut umiejętności"],
    ["sword", "Rzut ataku"],
    ["shield", "Rzut obronny"],
    ["more", "Inny rzut"],
  ];

  return (
    <section className="liveSessionPanel liveSessionQuickActionsPanel" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title">Szybkie akcje</h2>
      <div className="liveSessionQuickTiles">
        {isGmView ? gmActions.map(([icon, label]) => (
          <button key={label} type="button" onClick={onQuickRoll} disabled={!isInProgress}>
            <Icon name={icon} />
            <span>{label}</span>
          </button>
        )) : (
          <>
            <Link to="/dice"><Icon name="dice" /><span>Wykonaj własny rzut</span></Link>
            <Link to="/dice"><Icon name="clock" /><span>Historia moich rzutów</span></Link>
          </>
        )}
      </div>
    </section>
  );
}

function SceneFormFields({ draft, setDraft }) {
  return (
    <div className="liveSessionSceneFormGrid">
      <label className="campaignField">
        <span>Nazwa sceny</span>
        <input value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} maxLength={160} />
      </label>
      <label className="campaignField">
        <span>URL obrazu sceny</span>
        <input value={draft.imageUrl} onChange={(event) => setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))} />
      </label>
      <ImageUpload
        label="Wgraj obraz sceny"
        value={draft.imageUrl}
        onChange={(url) => setDraft((prev) => ({ ...prev, imageUrl: url }))}
        onRemove={() => setDraft((prev) => ({ ...prev, imageUrl: "" }))}
        previewAlt="Obraz sceny"
      />
      <label className="campaignField liveSessionSceneWideField">
        <span>Opis sceny</span>
        <textarea value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} rows={4} maxLength={5000} />
      </label>
      <label className="campaignField">
        <span>Lokalizacja</span>
        <input value={draft.location} onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))} maxLength={160} />
      </label>
      <label className="campaignField">
        <span>Nastrój</span>
        <input value={draft.mood} onChange={(event) => setDraft((prev) => ({ ...prev, mood: event.target.value }))} maxLength={120} />
      </label>
      <label className="liveSessionSceneVisibility liveSessionSceneWideField">
        <input type="checkbox" checked={draft.visibleToPlayers} onChange={(event) => setDraft((prev) => ({ ...prev, visibleToPlayers: event.target.checked }))} />
        <span>Widoczna dla graczy po zapisaniu aktywnej sceny</span>
      </label>
    </div>
  );
}

function SceneModal({ mode, draft, setDraft, scenes, activeSceneId, saving, onClose, onSave, onSelect, onAddFromEmpty }) {
  if (!mode) return null;
  const title = mode === "edit" ? "Edytuj scenę" : mode === "add" ? "Dodaj scenę" : "Zmień scenę";

  return (
    <div className="liveSessionModalOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="liveSessionModal" role="dialog" aria-modal="true" aria-labelledby="scene-modal-title">
        <div className="liveSessionModalHeader">
          <h2 id="scene-modal-title">{title}</h2>
          <button type="button" className="liveSessionCloseButton" onClick={onClose} aria-label="Zamknij">×</button>
        </div>

        {mode === "change" ? (
          scenes.length ? (
            <div className="liveSessionScenePicker">
              {scenes.map((scene) => (
                <article className="liveSessionSceneOption" key={scene.id}>
                  {scene.imageUrl ? <img src={scene.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="liveSessionSceneThumbEmpty">Brak obrazu</span>}
                  <div>
                    <strong>{firstDefined(scene.title, "Bez nazwy")}</strong>
                    <p>{firstDefined(scene.description, "Brak opisu sceny.")}</p>
                    <small>{scene.id === activeSceneId ? "Aktualna scena" : scene.visibleToPlayers ? "Widoczna dla graczy" : "Ukryta"}</small>
                  </div>
                  <button className="campaignDetailsPrimaryBtn" type="button" onClick={() => onSelect(scene)} disabled={saving || scene.id === activeSceneId}>Ustaw jako aktywną</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="liveSessionModalEmpty">
              <p>Brak przygotowanych scen kampanii.</p>
              <button className="campaignDetailsPrimaryBtn" type="button" onClick={onAddFromEmpty}>Dodaj scenę</button>
            </div>
          )
        ) : (
          <form onSubmit={onSave}>
            <SceneFormFields draft={draft} setDraft={setDraft} />
            <div className="liveSessionModalActions">
              <button className="campaignDetailsGhostBtn" type="button" onClick={onClose}>Anuluj</button>
              <button className="campaignDetailsPrimaryBtn" type="submit" disabled={saving}>{mode === "edit" ? "Zapisz scenę" : "Dodaj scenę"}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
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
  const [attendance, setAttendance] = useState([]);
  const [, setRecentRolls] = useState([]);
  const [liveState, setLiveState] = useState(null);
  const [sceneLibrary, setSceneLibrary] = useState([]);
  const [activeSceneId, setActiveSceneId] = useState("");
  const [sceneModal, setSceneModal] = useState(null);
  const [sceneDraft, setSceneDraft] = useState(EMPTY_SCENE_DRAFT);
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
  const [now, setNow] = useState(Date.now());

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

  const activeScene = useMemo(() => {
    return sceneLibrary.find((scene) => scene.id === activeSceneId) || sceneFromLiveState(liveState);
  }, [sceneLibrary, activeSceneId, liveState]);

  const playerCanSeeScene = Boolean(sceneHasContent(liveState) || activeScene?.visibleToPlayers);

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

  const fulfilledRequestedRolls = useMemo(() => requestedRolls.filter(requestedRollResolved), [requestedRolls]);

  const rollStats = useMemo(() => {
    const totals = fulfilledRequestedRolls.map(requestedRollResult).filter((value) => value != null);
    return {
      count: totals.length,
      average: totals.length ? Math.round((totals.reduce((sum, n) => sum + n, 0) / totals.length) * 10) / 10 : null,
      highest: totals.length ? Math.max(...totals) : null,
      lowest: totals.length ? Math.min(...totals) : null,
      success: fulfilledRequestedRolls.filter((roll) => roll.success === true && requestedRollResult(roll) != null).length,
      failed: fulfilledRequestedRolls.filter((roll) => roll.success === false && requestedRollResult(roll) != null).length,
      unknown: fulfilledRequestedRolls.filter((roll) => roll.success == null && requestedRollResult(roll) != null).length,
    };
  }, [fulfilledRequestedRolls]);

  const sessionDuration = useMemo(() => {
    if (!session || isPlanned) return "00:00:00";
    const end = isFinished && session.finishedAt ? new Date(session.finishedAt).getTime() : now;
    return formatDuration(end - getSessionStartTimestamp(session));
  }, [session, isPlanned, isFinished, now]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [campaignData, sessionsData, campaignCharactersData, membersData, attendanceData, rollsData, liveStateData, requestedRollsData] = await Promise.all([
          getCampaignById(token, campaignId),
          listCampaignSessions(token, campaignId),
          getCampaignCharacters(token, campaignId),
          listCampaignMembers(token, campaignId).catch(() => []),
          getSessionAttendance(token, campaignId, sessionId).catch(() => []),
          getCampaignDiceRolls(token, campaignId, { sessionId, limit: 200 }).catch(() => []),
          getSessionLiveState(token, campaignId, sessionId).catch(() => null),
          getRequestedRolls(token, campaignId, sessionId).catch(() => []),
        ]);
        const resolvedSession = Array.isArray(sessionsData)
          ? sessionsData.find((item) => String(item.id) === String(sessionId)) || null
          : null;
        const storedScenes = readSceneLibrary(campaignId, sessionId);
        const merged = mergeLiveSceneIntoLibrary(campaignId, sessionId, storedScenes, liveStateData);
        setCampaign(campaignData);
        setSession(resolvedSession);
        setCampaignCharacters(Array.isArray(campaignCharactersData) ? campaignCharactersData : []);
        setMembers(Array.isArray(membersData) ? membersData : []);
        setAttendance(Array.isArray(attendanceData?.responses) ? attendanceData.responses : Array.isArray(attendanceData) ? attendanceData : []);
        setRecentRolls(Array.isArray(rollsData) ? rollsData : []);
        setLiveState(liveStateData);
        setSceneLibrary(merged.scenes);
        setActiveSceneId(merged.activeSceneId);
        setRequestedRolls(Array.isArray(requestedRollsData) ? requestedRollsData : []);
      } catch (err) {
        setError(err?.message || "Nie udało się załadować sesji live.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, campaignId, sessionId]);

  async function reloadSessionData() {
    const [sessionsData, requested, rollsData, liveStateData, attendanceData] = await Promise.all([
      listCampaignSessions(token, campaignId),
      getRequestedRolls(token, campaignId, sessionId).catch(() => []),
      getCampaignDiceRolls(token, campaignId, { sessionId, limit: 200 }).catch(() => []),
      getSessionLiveState(token, campaignId, sessionId).catch(() => null),
      getSessionAttendance(token, campaignId, sessionId).catch(() => []),
    ]);

    const resolvedSession = Array.isArray(sessionsData)
      ? sessionsData.find((item) => String(item.id) === String(sessionId)) || null
      : null;
    setSession(resolvedSession);
    setRequestedRolls(Array.isArray(requested) ? requested : []);
    setRecentRolls(Array.isArray(rollsData) ? rollsData : []);
    setLiveState(liveStateData || null);
    setAttendance(Array.isArray(attendanceData?.responses) ? attendanceData.responses : Array.isArray(attendanceData) ? attendanceData : []);
  }

  function persistScenes(nextScenes) {
    setSceneLibrary(nextScenes);
    writeSceneLibrary(campaignId, sessionId, nextScenes);
  }

  async function syncActiveScene(scene, markVisible = scene?.visibleToPlayers) {
    const nextScene = { ...scene, visibleToPlayers: Boolean(markVisible), updatedAt: new Date().toISOString() };
    const nextScenes = sceneLibrary.map((item) => item.id === nextScene.id ? nextScene : item);
    persistScenes(nextScenes);
    setActiveSceneId(nextScene.id);
    const updated = await updateSessionLiveState(token, campaignId, sessionId, scenePayload(nextScene));
    setLiveState(updated);
    return nextScene;
  }

  async function handleStartSession() {
    setSessionActionBusy(true);
    setError("");
    setNotice("");
    try {
      await startCampaignSession(token, campaignId, sessionId);
      await reloadSessionData();
      setNotice("Sesja rozpoczęta.");
    } catch (err) {
      setError(err?.message || "Nie udało się rozpocząć sesji.");
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
      setNotice("Sesja zakończona.");
    } catch (err) {
      setError(err?.message || "Nie udało się zakończyć sesji.");
    } finally {
      setSessionActionBusy(false);
    }
  }

  function toggleSelected(setter, value) {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  }

  function openEditScene() {
    if (!activeScene) return;
    setSceneDraft({ ...EMPTY_SCENE_DRAFT, ...activeScene });
    setSceneModal("edit");
  }

  function openAddScene() {
    setSceneDraft({ ...EMPTY_SCENE_DRAFT, id: makeSceneId() });
    setSceneModal("add");
  }

  async function handleSaveScene(event) {
    event.preventDefault();
    const scene = normalizeSceneDraft(sceneDraft);
    setSavingScene(true);
    setNotice("");
    setError("");
    try {
      if (sceneModal === "add") {
        const nextScenes = [scene, ...sceneLibrary];
        persistScenes(nextScenes);
        setNotice("Scena dodana do listy.");
      } else {
        const sceneExists = sceneLibrary.some((item) => item.id === scene.id);
        const nextScenes = sceneExists ? sceneLibrary.map((item) => item.id === scene.id ? scene : item) : [scene, ...sceneLibrary];
        persistScenes(nextScenes);
        if (scene.id === activeSceneId || activeScene?.fromLiveState) {
          const updated = await updateSessionLiveState(token, campaignId, sessionId, scenePayload(scene));
          setLiveState(updated);
          setActiveSceneId(scene.id);
        }
        setNotice("Scena zapisana.");
      }
      setSceneModal(null);
    } catch (err) {
      setError(err?.message || "Nie udało się zapisać sceny.");
    } finally {
      setSavingScene(false);
    }
  }

  async function handleSelectScene(scene) {
    setSavingScene(true);
    setNotice("");
    setError("");
    try {
      await syncActiveScene(scene, scene.visibleToPlayers);
      setSceneModal(null);
      setNotice("Aktywna scena została zmieniona.");
    } catch (err) {
      setError(err?.message || "Nie udało się zmienić sceny.");
    } finally {
      setSavingScene(false);
    }
  }

  async function handlePublishScene() {
    if (!activeScene) return;
    setSavingScene(true);
    setNotice("");
    setError("");
    try {
      await syncActiveScene(activeScene, true);
      setNotice("Scena jest widoczna dla graczy.");
    } catch (err) {
      setError(err?.message || "Nie udało się udostępnić sceny graczom.");
    } finally {
      setSavingScene(false);
    }
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
      setError("Wybierz co najmniej jedną postać.");
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
      setNotice("Rzut został wysłany do graczy.");
      setShowQuickRollPanel(false);
      setTargetMode("ALL");
      setSelectedCharacterIds([]);
      setSelectedUserIds([]);
      event.currentTarget.reset();
    } catch (err) {
      setError(err?.message || "Nie udało się utworzyć requested roll.");
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
      setError(err?.message || "Nie udało się wykonać requested roll.");
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
      setError(err?.message || "Nie udało się anulować requested roll.");
    } finally {
      setRequestedActionBusy(false);
    }
  }

  const quickRollForm = (
    <form className="campaignFormCard liveSessionQuickRollPanel" onSubmit={handleCreateRequestedRoll}>
      <label className="campaignField"><span>Etykieta rzutu</span><input name="rollLabel" maxLength={160} required placeholder="np. Skradanie się w porcie" /></label>
      <label className="campaignField"><span>Trudność / DC</span><input name="dc" type="number" min="0" placeholder="14" /></label>
      <label className="campaignField"><span>Typ rzutu</span><input name="rollType" defaultValue="SKILL" maxLength={40} /></label>
      <label className="campaignField"><span>Wyrażenie rzutu</span><input name="rollExpression" defaultValue={campaign?.systemCode === "dnd5e" ? "1d20" : ""} maxLength={120} /></label>
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
              <input type="checkbox" checked={selectedCharacterIds.includes(Number(character.characterId))} onChange={() => toggleSelected(setSelectedCharacterIds, Number(character.characterId))} />
              <span>{character.characterName || `Postać #${character.characterId}`}</span>
            </label>
          ))}
        </div>
      )}

      {targetMode === "USER" && (
        <div className="liveSessionTargetList" aria-label="Lista graczy">
          {members.map((member) => (
            <label key={member.id} className="liveSessionTargetItem">
              <input type="checkbox" checked={selectedUserIds.includes(Number(member.id))} onChange={() => toggleSelected(setSelectedUserIds, Number(member.id))} />
              <span>{memberDisplayName(member)}</span>
            </label>
          ))}
        </div>
      )}

      <button className="campaignDetailsGhostBtn" type="button" onClick={() => setShowAdvancedRequested((prev) => !prev)}>
        {showAdvancedRequested ? "Ukryj opcje zaawansowane" : "Pokaż opcje zaawansowane"}
      </button>

      {showAdvancedRequested ? (
        <div className="campaignFormCard liveSessionAdvancedRollFields">
          <label className="campaignField"><span>Ability key</span><input name="abilityKey" maxLength={80} /></label>
          <label className="campaignField"><span>Skill key</span><input name="skillKey" maxLength={80} /></label>
          <label className="campaignField"><span><input name="isDcHidden" type="checkbox" defaultChecked /> ukryj DC</span></label>
          <label className="campaignField"><span><input name="showSuccessToPlayer" type="checkbox" /> pokaż sukces graczowi</span></label>
        </div>
      ) : null}

      <button className="campaignDetailsPrimaryBtn" type="submit" disabled={requestedActionBusy}>Wyślij do graczy</button>
    </form>
  );

  return (
    <div className="page liveSessionPage">
      <LiveSessionHeader
        campaign={campaign}
        session={session}
        isGmView={isGmView}
        isPlanned={isPlanned}
        isInProgress={isInProgress}
        isFinished={isFinished}
        duration={sessionDuration}
        campaignId={campaignId}
        busy={sessionActionBusy}
        onStart={handleStartSession}
        onFinish={handleFinishSession}
      />

      {loading && <div className="liveSessionState">Ładowanie sesji live...</div>}
      {error && <div className="campaignDetailsError">{error}</div>}
      {notice && <div className="campaignDetailsNotice">{notice}</div>}

      {!loading && !error && (
        <div className="liveSessionDashboard">
          <div className="liveSessionMainGrid">
            <ScenePanel
              isGmView={isGmView}
              isFinished={isFinished}
              activeScene={activeScene}
              playerCanSeeScene={playerCanSeeScene}
              onOpenEdit={openEditScene}
              onOpenChange={() => setSceneModal("change")}
              onOpenAdd={openAddScene}
              onPublish={handlePublishScene}
              publishing={savingScene}
            />
            <aside className="liveSessionSideColumn">
              <PlayerStrip characters={campaignCharacters} members={members} attendance={attendance} />
              <div className="liveSessionSideSplit">
                <RollHistoryPanel rolls={fulfilledRequestedRolls} />
                <RollAnalysisPanel stats={rollStats} />
              </div>
            </aside>
          </div>

          <div className="liveSessionBottomGrid">
            <RequiredRollsPanel
              isGmView={isGmView}
              isInProgress={isInProgress}
              isPlanned={isPlanned}
              isFinished={isFinished}
              rolls={myRequestedRolls}
              busy={requestedActionBusy}
              onFulfill={handleFulfillRequestedRoll}
              onCancel={handleCancelRequestedRoll}
              showQuickRollPanel={showQuickRollPanel}
              setShowQuickRollPanel={setShowQuickRollPanel}
              form={quickRollForm}
            />
            <QuickActionsPanel isGmView={isGmView} isInProgress={isInProgress} onQuickRoll={() => setShowQuickRollPanel(true)} />
          </div>

          {!isGmView && isFinished && (
            <section className="liveSessionPanel">
              <h2>Po sesji</h2>
              <p className="liveSessionPlaceholder">Sesja została zakończona. Możesz wrócić do kampanii i dopisać notatki po sesji.</p>
              <Link className="campaignDetailsPrimaryBtn" to={`/campaigns/${campaignId}`}>Wróć do kampanii</Link>
            </section>
          )}
        </div>
      )}

      <SceneModal
        mode={sceneModal}
        draft={sceneDraft}
        setDraft={setSceneDraft}
        scenes={sceneLibrary}
        activeSceneId={activeSceneId}
        saving={savingScene}
        onClose={() => setSceneModal(null)}
        onSave={handleSaveScene}
        onSelect={handleSelectScene}
        onAddFromEmpty={openAddScene}
      />
    </div>
  );
}
