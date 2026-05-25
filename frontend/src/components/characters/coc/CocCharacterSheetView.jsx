import { useEffect, useState } from "react";
import CocInvestigatorHeader from "./sheet/CocInvestigatorHeader";
import CocCharacteristicsPanel from "./sheet/CocCharacteristicsPanel";
import CocDerivedStatsPanel from "./sheet/CocDerivedStatsPanel";
import CocSkillsTable from "./sheet/CocSkillsTable";
import CocCombatPanel from "./sheet/CocCombatPanel";
import CocEquipmentPanel from "./sheet/CocEquipmentPanel";
import CocBackstoryPanel from "./sheet/CocBackstoryPanel";
import CocNotesPanel from "./sheet/CocNotesPanel";

export default function CocCharacterSheetView({ detail, onSave, saving, readOnly = false }) {
  const sheet = detail?.sheetJson && typeof detail.sheetJson === "object" ? detail.sheetJson : {};
  const identity = sheet.identity || {};
  const equipment = sheet.equipment || {};
  const notes = sheet.notes || {};

  const [name, setName] = useState(detail?.name || identity?.name || "");
  const [portraitUrl, setPortraitUrl] = useState(detail?.portraitUrl || identity?.portraitUrl || "");
  const [privateNotes, setPrivateNotes] = useState(detail?.privateNotes || notes?.privateNotes || "");
  const [inventory, setInventory] = useState(Array.isArray(equipment.items) ? equipment.items.join("\n") : "");

  useEffect(() => {
    const nextSheet = detail?.sheetJson && typeof detail.sheetJson === "object" ? detail.sheetJson : {};
    const nextIdentity = nextSheet.identity || {};
    const nextEquipment = nextSheet.equipment || {};
    const nextNotes = nextSheet.notes || {};
    setName(detail?.name || nextIdentity?.name || "");
    setPortraitUrl(detail?.portraitUrl || nextIdentity?.portraitUrl || "");
    setPrivateNotes(detail?.privateNotes || nextNotes?.privateNotes || "");
    setInventory(Array.isArray(nextEquipment.items) ? nextEquipment.items.join("\n") : "");
  }, [detail]);

  return (
    <div className="sheetLayout">
      <CocInvestigatorHeader
        identity={identity}
        name={name}
        onNameChange={setName}
        portraitUrl={portraitUrl}
        onPortraitUrlChange={setPortraitUrl}
        readOnly={readOnly}
      />
      <CocCharacteristicsPanel characteristics={sheet.characteristics} />
      <CocDerivedStatsPanel derived={sheet.derived} />
      <CocSkillsTable skills={sheet.skills} />
      <CocCombatPanel combat={sheet.combat} />
      <CocEquipmentPanel equipment={equipment} inventory={inventory} onInventoryChange={setInventory} readOnly={readOnly} />
      <CocBackstoryPanel backstory={sheet.backstory} />
      <CocNotesPanel privateNotes={privateNotes} onPrivateNotesChange={setPrivateNotes} readOnly={readOnly} />
      {!readOnly && (
        <div className="sheetActions">
          <button
            type="button"
            className="charactersPrimaryBtn"
            disabled={saving}
            onClick={() => onSave({
              name,
              portraitUrl,
              privateNotes,
              inventory: inventory.split("\n").map((line) => line.trim()).filter(Boolean),
            })}
          >
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </div>
      )}
    </div>
  );
}
