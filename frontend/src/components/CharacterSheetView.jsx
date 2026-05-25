import { useEffect, useState } from "react";
import CharacterHeader from "./characters/sheet/CharacterHeader";
import CombatPanel from "./characters/sheet/CombatPanel";
import AbilityScoresPanel from "./characters/sheet/AbilityScoresPanel";
import SavingThrowsPanel from "./characters/sheet/SavingThrowsPanel";
import SkillsTable from "./characters/sheet/SkillsTable";
import InventoryPanel from "./characters/sheet/InventoryPanel";
import FeaturesTraitsPanel from "./characters/sheet/FeaturesTraitsPanel";
import SpellsPanel from "./characters/sheet/SpellsPanel";
import NotesPanel from "./characters/sheet/NotesPanel";

export default function CharacterSheetView({ detail, onSave, saving, readOnly = false }) {
  const sheet = detail?.sheetJson && typeof detail.sheetJson === "object" ? detail.sheetJson : {};
  const sheetIsInvalid = !detail?.sheetJson || typeof detail.sheetJson !== "object";
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
    const nextSheet = detail?.sheetJson && typeof detail.sheetJson === "object" ? detail.sheetJson : {};
    const nextCombat = nextSheet.combat || {};
    const nextNotes = nextSheet.notes || {};
    setName(detail?.name || "");
    setPortraitUrl(detail?.portraitUrl || "");
    setCurrentHp(detail?.currentHp ?? nextCombat.currentHp ?? 0);
    setTempHp(detail?.tempHp ?? nextCombat.tempHp ?? 0);
    setPrivateNotes(detail?.privateNotes || nextNotes.privateNotes || "");
    setInventory(Array.isArray(nextSheet.inventory) ? nextSheet.inventory.join("\n") : "");
  }, [detail]);

  return (
    <div className="sheetLayout">
      {sheetIsInvalid && <div className="sheetEmpty">Karta postaci nie ma poprawnego sheet_json. Widok pokazuje tylko pola podstawowe.</div>}
      <CharacterHeader
        detail={detail}
        identity={identity}
        name={name}
        onNameChange={setName}
        portraitUrl={portraitUrl}
        onPortraitUrlChange={setPortraitUrl}
        readOnly={readOnly}
      />
      <CombatPanel
        combat={combat}
        currentHp={currentHp}
        tempHp={tempHp}
        onCurrentHpChange={setCurrentHp}
        onTempHpChange={setTempHp}
        readOnly={readOnly}
      />
      <AbilityScoresPanel abilityScores={abilities} />
      <SavingThrowsPanel savingThrows={sheet.savingThrows} />
      <SkillsTable skills={sheet.skills} />
      <InventoryPanel inventory={inventory} onInventoryChange={setInventory} readOnly={readOnly} />
      <FeaturesTraitsPanel featuresTraits={sheet.featuresTraits} />
      <SpellsPanel spells={sheet.spells} />
      <NotesPanel privateNotes={privateNotes} onPrivateNotesChange={setPrivateNotes} readOnly={readOnly} />
      {!readOnly && (
        <div className="sheetActions">
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
      )}
    </div>
  );
}
