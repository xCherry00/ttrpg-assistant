import { Link } from "react-router-dom";
import { imagePlaceholder } from "../../../data/imageLibrary";

export default function CampaignCharactersPanel({
  campaignCharacters,
  myCharacters,
  members = [],
  campaignSystemCode,
  canManage,
  isOwner = false,
  myUserId = null,
  busy,
  onAssign,
  onDetach,
}) {
  const normalizedCampaignSystem = (campaignSystemCode || "").trim().toLowerCase();
  const compatibleCharacters = myCharacters.filter(
    (character) => (character.systemCode || "").trim().toLowerCase() === normalizedCampaignSystem
  );

  const membersById = new Map(members.map((member) => [Number(member.id ?? member.userId), member]));

  return (
    <section className="campaignDetailsCard panel-soft">
      <h2 className="campaignDetailsCardTitle">Postacie kampanii</h2>

      {canManage && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const characterId = Number(new FormData(event.currentTarget).get("characterId"));
            if (!characterId) return;
            onAssign(characterId);
            event.currentTarget.reset();
          }}
          className="campaignToolbar"
        >
          <select className="cellSelect" name="characterId" defaultValue="">
            <option value="">- wybierz postać -</option>
            {compatibleCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} ({character.systemCode || "other"})
              </option>
            ))}
          </select>
          <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy}>Przypisz postać</button>
        </form>
      )}

      {canManage && myCharacters.length > 0 && compatibleCharacters.length === 0 && (
        <div className="campaignDetailsEmpty">Brak postaci zgodnych z systemem tej kampanii.</div>
      )}

      {campaignCharacters.length === 0 ? (
        <div className="campaignDetailsEmpty">Brak przypisanych postaci.</div>
      ) : (
        <div className="campaignMaterialList">
          {campaignCharacters.map((character) => (
            <article key={character.characterId} className="campaignMaterialCard">
              <div className="campaignMaterialCard__top">
                <strong>{character.characterName || "Postać"}</strong>
                <span className="campaignMemberBadge">{character.systemCode || "-"}</span>
              </div>
              <div className="campaignMaterialMeta">
                <span>Rasa: {character.raceName || "-"}</span>
                <span>Klasa: {character.className || "-"}</span>
                <span>Poziom: {character.level ?? "-"}</span>
              </div>
              <img src={character.portraitUrl || imagePlaceholder("characterAvatars")} alt={`Portret postaci ${character.characterName || ""}`} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }} />
              <div className="campaignMaterialMeta">
                <span>Gracz: {membersById.get(Number(character.userId))?.displayName || membersById.get(Number(character.userId))?.username || "-"}</span>
                <span>Przypisano: {character.assignedAt ? new Date(character.assignedAt).toLocaleString("pl-PL") : "-"}</span>
              </div>
              {!isOwner && Number(character.userId) === Number(myUserId) ? <Link className="campaignDetailsGhostBtn" to={`/characters/${character.characterId}`}>Otwórz moją kartę</Link> : null}
              {isOwner ? <Link className="campaignDetailsGhostBtn" to={`/characters/${character.characterId}?mode=preview`}>Podgląd karty</Link> : null}
              {canManage && (
                <button className="campaignDetailsGhostBtn" type="button" disabled={busy} onClick={() => onDetach(character.characterId)}>
                  Odepnij
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
