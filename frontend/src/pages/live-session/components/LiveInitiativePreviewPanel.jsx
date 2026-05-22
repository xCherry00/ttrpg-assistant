import { Link } from "react-router-dom";

function normalizeParticipantType(type) {
  if (!type) return "UNKNOWN";
  return String(type).toUpperCase();
}

function allegianceLabel(type) {
  const normalized = normalizeParticipantType(type);
  if (normalized === "PLAYER_CHARACTER") return "ally";
  if (normalized === "MONSTER") return "enemy";
  if (normalized === "NPC") return "neutral";
  if (normalized === "CUSTOM") return "unknown";
  return normalized;
}

function statusMessage(sessionStatus) {
  if (sessionStatus === "PLANNED") return "Podglad inicjatywy bedzie dostepny po rozpoczeciu sesji.";
  if (sessionStatus === "FINISHED") return "Sesja zakonczona. Podglad inicjatywy jest w trybie read-only.";
  return "";
}

function toQueue(encounter) {
  const participants = Array.isArray(encounter?.participants) ? encounter.participants : [];
  return [...participants].sort((a, b) => {
    const sortA = Number.isFinite(a?.sortOrder) ? a.sortOrder : 999999;
    const sortB = Number.isFinite(b?.sortOrder) ? b.sortOrder : 999999;
    if (sortA !== sortB) return sortA - sortB;
    const initA = Number.isFinite(a?.initiativeValue) ? a.initiativeValue : -999999;
    const initB = Number.isFinite(b?.initiativeValue) ? b.initiativeValue : -999999;
    return initB - initA;
  });
}

function getCurrentAndNext(queue, currentParticipantId, count = 2) {
  if (queue.length === 0) return [];
  const currentIndex = queue.findIndex((item) => String(item.id) === String(currentParticipantId));
  const start = currentIndex >= 0 ? currentIndex : 0;
  const result = [];
  for (let offset = 0; offset <= count; offset += 1) {
    result.push(queue[(start + offset) % queue.length]);
  }
  return result;
}

export default function LiveInitiativePreviewPanel({
  sessionStatus,
  isOwner,
  liveState,
  encounter,
  encounters = [],
  onSelectActiveEncounter,
  loading = false,
}) {
  const message = statusMessage(sessionStatus);
  const queue = toQueue(encounter);
  const ownerCanSelectEncounter = Boolean(isOwner && typeof onSelectActiveEncounter === "function" && Array.isArray(encounters));

  return (
    <section className="campaignDetailsCard panel-soft">
      <div className="liveInitiativeHeader">
        <h2 className="campaignDetailsCardTitle">Initiative Preview</h2>
        {isOwner && (
          <Link className="campaignDetailsGhostBtn" to="/initiative">
            Otworz szybki tracker MG
          </Link>
        )}
      </div>

      {ownerCanSelectEncounter && (
        <label className="campaignField">
          <span>Active encounter</span>
          <select
            value={liveState?.activeEncounterId ? String(liveState.activeEncounterId) : ""}
            onChange={(event) => {
              const value = event.target.value;
              onSelectActiveEncounter(value ? Number(value) : null);
            }}
            disabled={sessionStatus !== "IN_PROGRESS"}
          >
            <option value="">Brak aktywnego starcia</option>
            {encounters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || `Encounter #${item.id}`}
              </option>
            ))}
          </select>
        </label>
      )}

      {message && <p className="liveSessionPlaceholder">{message}</p>}
      {loading && <p className="liveSessionPlaceholder">Ladowanie podgladu inicjatywy...</p>}

      {!loading && !liveState?.activeEncounterId && (
        <p className="liveSessionPlaceholder">
          Brak aktywnego starcia dla tej sesji.
          {isOwner && encounters.length > 0 ? " Wybierz encounter z listy powyzej." : ""}
          {isOwner && encounters.length === 0 ? " Globalny /initiative dziala jako szybki lokalny tracker i nie zapisuje encounterow kampanijnych." : ""}
        </p>
      )}

      {!loading && liveState?.activeEncounterId && !encounter && (
        <p className="liveSessionPlaceholder">Nie udalo sie pobrac danych aktywnego starcia.</p>
      )}

      {!loading && encounter && isOwner && (
        <div className="liveInitiativeOwnerView">
          <p className="liveInitiativeMeta">
            Encounter: <strong>{encounter.name || `#${encounter.id}`}</strong> | Status: {encounter.status || "UNKNOWN"} | Runda:{" "}
            {encounter.roundNumber ?? "?"}
          </p>
          <div className="campaignMaterialList">
            {queue.map((participant) => (
              <article key={participant.id} className="campaignMaterialCard">
                <div className="campaignMaterialCard__top">
                  <strong>{participant.name || "Unknown participant"}</strong>
                  <span className="campaignMemberBadge">{normalizeParticipantType(participant.participantType)}</span>
                </div>
                <p>
                  {String(participant.id) === String(encounter.currentParticipantId) ? "Aktualna tura" : "W kolejce"} | Inicjatywa:{" "}
                  {participant.initiativeValue ?? "-"} (mod {participant.initiativeModifier ?? 0})
                </p>
                <p>
                  HP: {participant.currentHp ?? "?"}/{participant.maxHp ?? "?"} (temp: {participant.tempHp ?? 0})
                </p>
                <p>Conditions: {participant.conditions || "-"}</p>
                <p>Defeated: {participant.isDefeated ? "yes" : "no"}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && encounter && !isOwner && (
        <div className="liveInitiativePlayerView">
          <p className="liveInitiativeMeta">Runda: {encounter.roundNumber ?? "?"}</p>
          <div className="campaignMaterialList">
            {getCurrentAndNext(queue, encounter.currentParticipantId, 2).map((participant, index) => (
              <article key={`${participant.id}-${index}`} className="campaignMaterialCard">
                <div className="campaignMaterialCard__top">
                  <strong>{participant.name || "Unknown participant"}</strong>
                  <span className="campaignMemberBadge">{allegianceLabel(participant.participantType)}</span>
                </div>
                <p>{index === 0 ? "Aktualna tura" : `Nastepny #${index}`}</p>
                <p>Typ: {normalizeParticipantType(participant.participantType)}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
