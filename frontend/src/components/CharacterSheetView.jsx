import { useEffect, useState } from "react";

export default function CharacterSheetView({ detail, onSave, saving }) {
  const sheet = detail?.sheetJson || {};
  const identity = sheet.identity || {};
  const abilities = sheet.abilityScores || {};
  const combat = sheet.combat || {};
  const notes = sheet.notes || {};
  const [name, setName] = useState(detail?.name || "");
  const [portraitUrl, setPortraitUrl] = useState(detail?.portraitUrl || "");
  const [currentHp, setCurrentHp] = useState(detail?.currentHp ?? combat.currentHp ?? 0);
  const [tempHp, setTempHp] = useState(detail?.tempHp ?? combat.tempHp ?? 0);
  const [privateNotes, setPrivateNotes] = useState(detail?.privateNotes || notes.privateNotes || "");
  const [inventory, setInventory] = useState(Array.isArray(sheet.inventory) ? sheet.inventory.join("\n") : "");

  useEffect(() => {
    setName(detail?.name || "");
    setPortraitUrl(detail?.portraitUrl || "");
    setCurrentHp(detail?.currentHp ?? combat.currentHp ?? 0);
    setTempHp(detail?.tempHp ?? combat.tempHp ?? 0);
    setPrivateNotes(detail?.privateNotes || notes.privateNotes || "");
    setInventory(Array.isArray(sheet.inventory) ? sheet.inventory.join("\n") : "");
  }, [detail?.id]);

  const abilityEntries = Object.entries(abilities);

  return (
    <div className="charactersPanels">
      <div className="charactersPanel">
        <h3>Basic Info</h3>
        <div className="charactersGrid">
          <label className="charactersField"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="charactersField"><span>Portrait URL</span><input value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)} /></label>
          <label className="charactersField"><span>Race</span><input value={identity.race || detail?.raceName || ""} readOnly /></label>
          <label className="charactersField"><span>Class</span><input value={identity.className || detail?.className || ""} readOnly /></label>
          <label className="charactersField"><span>Background</span><input value={identity.background || detail?.backgroundName || ""} readOnly /></label>
          <label className="charactersField"><span>Level</span><input value={sheet.level ?? detail?.level ?? 1} readOnly /></label>
        </div>
      </div>

      <div className="charactersPanel">
        <h3>Ability Scores</h3>
        <div className="charactersGrid">
          {abilityEntries.map(([k, v]) => <label key={k} className="charactersField"><span>{k}</span><input value={v} readOnly /></label>)}
        </div>
      </div>

      <div className="charactersPanel">
        <h3>Combat</h3>
        <div className="charactersGrid">
          <label className="charactersField"><span>Max HP</span><input value={combat.maxHp ?? 0} readOnly /></label>
          <label className="charactersField"><span>Current HP</span><input type="number" min="0" value={currentHp} onChange={(e) => setCurrentHp(Number(e.target.value || 0))} /></label>
          <label className="charactersField"><span>Temp HP</span><input type="number" min="0" value={tempHp} onChange={(e) => setTempHp(Number(e.target.value || 0))} /></label>
          <label className="charactersField"><span>Armor Class</span><input value={combat.armorClass ?? 0} readOnly /></label>
          <label className="charactersField"><span>Initiative</span><input value={combat.initiative ?? 0} readOnly /></label>
          <label className="charactersField"><span>Speed</span><input value={combat.speed ?? 0} readOnly /></label>
        </div>
      </div>

      <div className="charactersPanel">
        <h3>Saving Throws</h3>
        <div>{Array.isArray(sheet.savingThrows) ? sheet.savingThrows.join(", ") : "-"}</div>
      </div>

      <div className="charactersPanel">
        <h3>Skills</h3>
        <div>{Array.isArray(sheet.skills) ? sheet.skills.join(", ") : "-"}</div>
      </div>

      <div className="charactersPanel">
        <h3>Inventory</h3>
        <label className="charactersField charactersField--full"><textarea rows="6" value={inventory} onChange={(e) => setInventory(e.target.value)} /></label>
      </div>

      <div className="charactersPanel">
        <h3>Features & Traits</h3>
        <div>{Array.isArray(sheet.featuresTraits) ? sheet.featuresTraits.join(", ") : "-"}</div>
      </div>

      {Array.isArray(sheet.spells) && (
        <div className="charactersPanel">
          <h3>Spells</h3>
          <div>{sheet.spells.join(", ")}</div>
        </div>
      )}

      <div className="charactersPanel">
        <h3>Notes</h3>
        <label className="charactersField charactersField--full"><span>Private Notes</span><textarea rows="6" value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} /></label>
      </div>

      <div className="charactersActionsFooter">
        <button
          type="button"
          className="charactersPrimaryBtn"
          disabled={saving}
          onClick={() => onSave({
            name,
            portraitUrl,
            currentHp,
            tempHp,
            privateNotes,
            inventory: inventory.split("\n").map((x) => x.trim()).filter(Boolean),
          })}
        >
          {saving ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
      </div>
    </div>
  );
}
