import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  finishCampaignSession,
  getCampaignById,
  getCampaignCharacters,
  getSessionAttendance,
  getSessionLiveState,
  listCampaignMembers,
  listCampaignSessions,
  startCampaignSession,
  updateSessionLiveState,
} from "../../api/campaigns";
import ImageUpload from "../../components/common/ImageUpload";
import { imagePlaceholder } from "../../data/imageLibrary";
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

function selectedCharacterStorageKey(campaignId, sessionId) {
  return `ttrpg.liveSessionCharacter.${campaignId}.${sessionId}`;
}

function characterIdValue(character) {
  return String(firstDefined(character?.characterId, character?.id, ""));
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
function emptyScenePayload() {
  return {
    sceneTitle: "",
    sceneImageUrl: "",
    sceneDescription: "",
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

function attendanceKind(status) {
  const value = String(status || "").toUpperCase();
  if (["AVAILABLE", "YES", "PRESENT", "ONLINE"].includes(value)) return "online";
  if (["MAYBE", "PENDING"].includes(value)) return "pending";
  if (["UNAVAILABLE", "NO", "ABSENT", "OFFLINE"].includes(value)) return "offline";
  return "unknown";
}

function Avatar({ name, src, size = "md", fallbackSrc = "" }) {
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  const imageSrc = src || fallbackSrc;
  return imageSrc ? (
    <img className={`liveSessionAvatar liveSessionAvatar--${size}`} src={imageSrc} alt={name || "Avatar"} onError={(event) => { event.currentTarget.style.display = "none"; }} />
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

function ScenePanel({ isGmView, isFinished, activeScene, playerCanSeeScene, onOpenChange, onOpenAdd }) {
  const visibleScene = isGmView || playerCanSeeScene ? activeScene : null;
  const hasScene = sceneHasContent(visibleScene);
  const sceneTitle = firstDefined(visibleScene?.title, isGmView ? "Brak aktywnej sceny" : "Scena niedostępna");
  const imageUrl = safeImageUrl(visibleScene?.imageUrl);
  return (
    <section className="liveSessionPanel liveSessionScenePanel" aria-labelledby="scene-panel-title">
      <div className="liveSessionPanelHeader">
        <h2 id="scene-panel-title">Panel sceny</h2>
      </div>

      <div className="liveSessionSceneMedia">
        {imageUrl ? (
          <img src={imageUrl} alt={sceneTitle} onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="liveSessionScenePlaceholder">
            <strong>{hasScene ? "Brak obrazu sceny" : isGmView ? "Brak aktywnej sceny" : "Scena niedostępna"}</strong>
            <span>{hasScene ? "Ta scena nie ma jeszcze przypisanego obrazu." : isGmView ? "Dodaj scenę, aby pokazać graczom obraz albo mapę." : "MG nie udostępnił jeszcze aktywnej sceny."}</span>
          </div>
        )}
      </div>

      {isGmView ? (
        <div className="liveSessionSceneActions">
          <button className="campaignDetailsGhostBtn" type="button" onClick={onOpenChange} disabled={isFinished}><Icon name="swap" /> Zmień scenę</button>
          <button className="campaignDetailsPrimaryBtn" type="button" onClick={onOpenAdd} disabled={isFinished}><Icon name="plus" /> Dodaj scenę</button>
        </div>
      ) : null}
    </section>
  );
}

function PlayerStrip({ characters, members, attendance, selectedCharacterId, currentUserId }) {
  const characterByUserId = useMemo(() => {
    const map = new Map();
    characters.forEach((character) => {
      const userId = Number(character?.userId);
      if (Number.isFinite(userId) && !map.has(userId)) map.set(userId, character);
    });
    return map;
  }, [characters]);
  const attendanceByUserId = useMemo(() => new Map(attendance.map((item) => [Number(item.userId), item])), [attendance]);
  const participants = useMemo(() => {
    if (members.length) {
      return members.map((member) => {
        const userId = Number(member?.userId ?? member?.id);
        const selectedCharacter = String(userId) === String(currentUserId)
          ? characters.find((character) => characterIdValue(character) === String(selectedCharacterId)) || null
          : null;
        return {
          id: `member-${userId || memberDisplayName(member)}`,
          member,
          character: selectedCharacter || characterByUserId.get(userId) || null,
          userId,
        };
      });
    }
    return characters.map((character) => {
      const userId = Number(character?.userId);
      return {
        id: `character-${character?.characterId || displayNameFromCharacter(character)}`,
        member: null,
        character,
        userId,
      };
    });
  }, [members, characters, characterByUserId, selectedCharacterId, currentUserId]);
  const knownStatuses = participants.map((item) => attendanceKind(attendanceByUserId.get(Number(item.userId))?.status));
  const onlineCount = knownStatuses.filter((status) => status === "online").length;
  const knownCount = knownStatuses.filter((status) => status !== "unknown").length;

  return (
    <section className="liveSessionPanel liveSessionPlayersPanel" aria-labelledby="players-title">
      <div className="liveSessionPanelHeader">
        <h2 id="players-title">Aktywni gracze / postacie</h2>
        {participants.length ? (
          knownCount ? <span className="liveSessionOnlineCount"><span />{onlineCount} z {participants.length} obecnych</span> : <span className="liveSessionOnlineCount is-muted"><span />Obecność nieznana</span>
        ) : null}
      </div>
      {participants.length ? (
        <div className="liveSessionPlayerStrip">
          {participants.map(({ id, member, character, userId }) => {
            const isCurrentUser = String(userId) === String(currentUserId);
            const name = character ? displayNameFromCharacter(character) : isCurrentUser ? "Nie wybrano postaci" : "Brak przypisanej postaci";
            const playerName = memberDisplayName(member);
            const status = attendanceKind(attendanceByUserId.get(Number(userId))?.status);
            return (
              <article className="liveSessionPlayerCard" key={id}>
                <div className="liveSessionAvatarWrap"><Avatar name={name || playerName} src={character?.portraitUrl || member?.avatarUrl} fallbackSrc={character ? imagePlaceholder("characterAvatars") : ""} /><span className={`liveSessionOnlineDot liveSessionOnlineDot--${status}`} /></div>
                <div>
                  <span>{playerName}</span>
                  <strong>{name}</strong>
                  <small>{character ? archetypeFromCharacter(character) : "Nie wybrano postaci"}</small>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="liveSessionPlaceholder">Brak aktywnych graczy w tej sesji.</p>
      )}
    </section>
  );
}

function SceneFormFields({ draft, setDraft }) {
  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="liveSessionSceneForm">
      <label className="campaignField">
        <span>Tytuł sceny</span>
        <input
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
          maxLength={160}
          placeholder="Np. Brama do podziemi"
          required
        />
      </label>
      <div className="liveSessionTwoCols">
        <label className="campaignField">
          <span>Lokacja</span>
          <input
            value={draft.location}
            onChange={(event) => update("location", event.target.value)}
            maxLength={120}
            placeholder="Np. Stare ruiny"
          />
        </label>
        <label className="campaignField">
          <span>Nastroj</span>
          <input
            value={draft.mood}
            onChange={(event) => update("mood", event.target.value)}
            maxLength={120}
            placeholder="Np. Niepokoj"
          />
        </label>
      </div>
      <label className="campaignField">
        <span>Opis sceny</span>
        <textarea
          value={draft.description}
          onChange={(event) => update("description", event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Krotki opis tego, co widza gracze..."
        />
      </label>
      <ImageUpload
        value={draft.imageUrl}
        onChange={(url) => update("imageUrl", url)}
        onRemove={() => update("imageUrl", "")}
        label="Obraz sceny"
        previewAlt="Obraz sceny"
        autoUpload
      />
      <label className="liveSessionCheckbox">
        <input
          type="checkbox"
          checked={draft.visibleToPlayers}
          onChange={(event) => update("visibleToPlayers", event.target.checked)}
        />
        <span>Widoczna dla graczy</span>
      </label>
    </div>
  );
}

function SceneModal({ mode, draft, setDraft, scenes, activeSceneId, saving, onClose, onSave, onSelect, onDelete, onAddFromEmpty }) {
  if (!mode) return null;
  const title = mode === "add" ? "Dodaj scenę" : "Zmień scenę";

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
                    <small>{scene.id === activeSceneId ? "Aktualna scena" : scene.visibleToPlayers ? "Widoczna dla graczy" : "Ukryta"}</small>
                  </div>
                  <div className="liveSessionSceneOptionActions">
                    {scene.id === activeSceneId ? (
                      <span className="liveSessionSceneActiveStatus">Aktywna</span>
                    ) : (
                      <button className="campaignDetailsPrimaryBtn" type="button" onClick={() => onSelect(scene)} disabled={saving}>Ustaw jako aktywną</button>
                    )}
                    <button className="campaignDetailsGhostBtn liveSessionSceneDeleteBtn" type="button" onClick={() => onDelete(scene)} disabled={saving}>Usuń</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="liveSessionModalEmpty">
              <p>Brak przygotowanych scen.</p>
              <button className="campaignDetailsPrimaryBtn" type="button" onClick={onAddFromEmpty}>Dodaj scenę</button>
            </div>
          )
        ) : (
          <form onSubmit={onSave}>
            <SceneFormFields draft={draft} setDraft={setDraft} />
            <div className="liveSessionModalActions">
              <button className="campaignDetailsGhostBtn" type="button" onClick={onClose}>Anuluj</button>
              <button className="campaignDetailsPrimaryBtn" type="submit" disabled={saving}>Zapisz scenę</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function CharacterChoiceModal({ characters, onSelect }) {
  if (!characters.length) return null;
  return (
    <div className="liveSessionModalOverlay liveSessionCharacterChoiceOverlay" role="presentation">
      <section className="liveSessionModal liveSessionCharacterChoiceModal" role="dialog" aria-modal="true" aria-labelledby="character-choice-title">
        <div className="liveSessionModalHeader">
          <h2 id="character-choice-title">Wybierz postać</h2>
        </div>
        <div className="liveSessionCharacterChoiceList">
          {characters.map((character) => {
            const id = characterIdValue(character);
            return (
              <button className="liveSessionCharacterChoiceCard" type="button" key={id} onClick={() => onSelect(id)}>
                <Avatar name={displayNameFromCharacter(character)} src={character?.portraitUrl} fallbackSrc={imagePlaceholder("characterAvatars")} />
                <span>{displayNameFromCharacter(character)}</span>
                <small>{archetypeFromCharacter(character)}</small>
              </button>
            );
          })}
        </div>
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
  const [, setLiveState] = useState(null);
  const [sceneLibrary, setSceneLibrary] = useState([]);
  const [activeSceneId, setActiveSceneId] = useState("");
  const [activeScene, setActiveScene] = useState(null);
  const [sceneModal, setSceneModal] = useState(null);
  const [sceneDraft, setSceneDraft] = useState(EMPTY_SCENE_DRAFT);
  const [savingScene, setSavingScene] = useState(false);
  const [selectedSessionCharacterId, setSelectedSessionCharacterId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(selectedCharacterStorageKey(campaignId, sessionId)) || "";
  });
  const [notice, setNotice] = useState("");
  const [sessionActionBusy, setSessionActionBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [headerTarget, setHeaderTarget] = useState(null);

  const isGmView = Boolean(campaign?.owner);
  const isPlanned = session?.status === "PLANNED";
  const isInProgress = session?.status === "IN_PROGRESS";
  const isFinished = session?.status === "FINISHED";
  const currentMember = useMemo(() => members.find((member) => member?.self || member?.currentUser || member?.me) || null, [members]);
  const currentUserId = currentMember ? Number(currentMember.userId ?? currentMember.id) : null;
  const availableSessionCharacters = useMemo(() => {
    if (!currentUserId) return [];
    return campaignCharacters.filter((character) => Number(character?.userId) === Number(currentUserId));
  }, [campaignCharacters, currentUserId]);
  const selectedCharacterStillAvailable = availableSessionCharacters.some((character) => characterIdValue(character) === String(selectedSessionCharacterId));
  const shouldShowCharacterChoice = !isGmView && !isPlanned && !loading && !error && availableSessionCharacters.length > 0 && !selectedCharacterStillAvailable;

  const playerCanSeeScene = Boolean(activeScene?.visibleToPlayers);

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
    setHeaderTarget(document.getElementById("live-session-header-slot"));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [campaignData, sessionsData, campaignCharactersData, membersData, attendanceData, liveStateData] = await Promise.all([
          getCampaignById(token, campaignId),
          listCampaignSessions(token, campaignId),
          getCampaignCharacters(token, campaignId),
          listCampaignMembers(token, campaignId).catch(() => []),
          getSessionAttendance(token, campaignId, sessionId).catch(() => []),
          getSessionLiveState(token, campaignId, sessionId).catch(() => null),
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
        setLiveState(liveStateData);
        setSceneLibrary(merged.scenes);
        setActiveSceneId(merged.activeSceneId);
        setActiveScene(merged.scenes.find((scene) => scene.id === merged.activeSceneId) || sceneFromLiveState(liveStateData) || null);
      } catch (err) {
        setError(err?.message || "Nie udało się załadować sesji live.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, campaignId, sessionId]);

  async function reloadSessionData() {
    const [sessionsData, liveStateData, attendanceData] = await Promise.all([
      listCampaignSessions(token, campaignId),
      getSessionLiveState(token, campaignId, sessionId).catch(() => null),
      getSessionAttendance(token, campaignId, sessionId).catch(() => []),
    ]);

    const resolvedSession = Array.isArray(sessionsData)
      ? sessionsData.find((item) => String(item.id) === String(sessionId)) || null
      : null;
    setSession(resolvedSession);
    setLiveState(liveStateData || null);
    setActiveScene((current) => current || sceneFromLiveState(liveStateData));
    setAttendance(Array.isArray(attendanceData?.responses) ? attendanceData.responses : Array.isArray(attendanceData) ? attendanceData : []);
  }

  function persistScenes(nextScenes) {
    setSceneLibrary(nextScenes);
    writeSceneLibrary(campaignId, sessionId, nextScenes);
  }

  async function syncActiveScene(scene, markVisible = true) {
    const nextScene = { ...scene, visibleToPlayers: Boolean(markVisible), updatedAt: new Date().toISOString() };
    const nextScenes = sceneLibrary.some((item) => item.id === nextScene.id)
      ? sceneLibrary.map((item) => item.id === nextScene.id ? nextScene : item)
      : [nextScene, ...sceneLibrary];
    persistScenes(nextScenes);
    setActiveSceneId(nextScene.id);
    setActiveScene(nextScene);
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

  function openAddScene() {
    setSceneDraft({ ...EMPTY_SCENE_DRAFT, id: makeSceneId() });
    setSceneModal("add");
  }

  function handleSelectSessionCharacter(characterId) {
    setSelectedSessionCharacterId(characterId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(selectedCharacterStorageKey(campaignId, sessionId), characterId);
    }
  }

  async function handleSaveScene(event) {
    event.preventDefault();
    const scene = normalizeSceneDraft(sceneDraft);
    setSavingScene(true);
    setNotice("");
    setError("");
    try {
      if (sceneModal === "add") {
        const visibleScene = { ...scene, visibleToPlayers: true };
        const nextScenes = [visibleScene, ...sceneLibrary];
        persistScenes(nextScenes);
        setActiveSceneId(visibleScene.id);
        setActiveScene(visibleScene);
        const updated = await updateSessionLiveState(token, campaignId, sessionId, scenePayload(visibleScene));
        setLiveState(updated);
      } else {
        const sceneExists = sceneLibrary.some((item) => item.id === scene.id);
        const nextScenes = sceneExists ? sceneLibrary.map((item) => item.id === scene.id ? scene : item) : [scene, ...sceneLibrary];
        persistScenes(nextScenes);
        if (scene.id === activeSceneId || activeScene?.fromLiveState) {
          const activeVersion = { ...scene, visibleToPlayers: true };
          const updated = await updateSessionLiveState(token, campaignId, sessionId, scenePayload(scene));
          setLiveState(updated);
          setActiveSceneId(scene.id);
          setActiveScene(activeVersion);
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
      await syncActiveScene(scene, true);
      setSceneModal(null);
    } catch (err) {
      setError(err?.message || "Nie udało się zmienić sceny.");
    } finally {
      setSavingScene(false);
    }
  }

  async function handleDeleteScene(scene) {
    if (!scene) return;
    const sceneName = firstDefined(scene.title, "tę scenę");
    if (typeof window !== "undefined" && !window.confirm(`Usunąć scenę „${sceneName}”?`)) return;
    setSavingScene(true);
    setNotice("");
    setError("");
    try {
      const nextScenes = sceneLibrary.filter((item) => item.id !== scene.id);
      persistScenes(nextScenes);
      if (scene.id === activeSceneId) {
        setActiveSceneId("");
        setActiveScene(null);
        const updated = await updateSessionLiveState(token, campaignId, sessionId, emptyScenePayload());
        setLiveState(updated);
      }
    } catch (err) {
      setError(err?.message || "Nie udało się usunąć sceny.");
    } finally {
      setSavingScene(false);
    }
  }

  const sessionHeader = (
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
  );
  const playerWaitingForStart = !isGmView && isPlanned;

  return (
    <div className="page liveSessionPage">
      {headerTarget ? createPortal(sessionHeader, headerTarget) : null}

      {loading && <div className="liveSessionState">Ładowanie sesji live...</div>}
      {error && <div className="campaignDetailsError">{error}</div>}
      {notice && <div className="campaignDetailsNotice">{notice}</div>}

      {!loading && !error && playerWaitingForStart && (
        <section className="liveSessionState">
          <h2>Sesja nie została jeszcze uruchomiona</h2>
          <p>Gracze mogą wejść do live session dopiero po rozpoczęciu sesji przez MG.</p>
          <Link className="campaignDetailsPrimaryBtn" to={`/campaigns/${campaignId}`}>Wróć do kampanii</Link>
        </section>
      )}

      {!loading && !error && !playerWaitingForStart && (
        <div className="liveSessionDashboard">
          <div className="liveSessionMainGrid">
            <ScenePanel
              isGmView={isGmView}
              isFinished={isFinished}
              activeScene={activeScene}
              playerCanSeeScene={playerCanSeeScene}
              onOpenChange={() => setSceneModal("change")}
              onOpenAdd={openAddScene}
            />
            <aside className="liveSessionSideColumn">
              <PlayerStrip
                characters={campaignCharacters}
                members={members}
                attendance={attendance}
                selectedCharacterId={selectedSessionCharacterId}
                currentUserId={currentUserId}
              />
            </aside>
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
        onDelete={handleDeleteScene}
        onAddFromEmpty={openAddScene}
      />
      {shouldShowCharacterChoice ? (
        <CharacterChoiceModal characters={availableSessionCharacters} onSelect={handleSelectSessionCharacter} />
      ) : null}
    </div>
  );
}
