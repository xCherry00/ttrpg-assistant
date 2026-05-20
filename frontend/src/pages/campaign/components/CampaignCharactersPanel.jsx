export default function CampaignCharactersPanel({
  campaignCharacters,
  myCharacters,
  canManage,
  busy,
  onAssign,
  onDetach,
}) {
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
            <option value="">- wybierz postac -</option>
            {myCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} ({character.systemCode || "other"})
              </option>
            ))}
          </select>
          <button className="campaignDetailsPrimaryBtn" type="submit" disabled={busy}>Przypisz postac</button>
        </form>
      )}

      {campaignCharacters.length === 0 ? (
        <div className="campaignDetailsEmpty">Brak przypisanych postaci.</div>
      ) : (
        <div className="campaignMaterialList">
          {campaignCharacters.map((character) => (
            <article key={character.characterId} className="campaignMaterialCard">
              <div className="campaignMaterialCard__top">
                <strong>{character.characterName}</strong>
                <span className="campaignMemberBadge">{character.systemCode || "-"}</span>
              </div>
              <p>
                Rasa/klasa/tlo: {character.race || "-"} / {character.className || "-"} / {character.background || "-"}
              </p>
              <div className="campaignMaterialMeta">
                <span>Wlasciciel: {character.ownerDisplayName || character.ownerUsername || "-"}</span>
                <span>Przypisano: {character.assignedAt ? new Date(character.assignedAt).toLocaleString("pl-PL") : "-"}</span>
              </div>
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
