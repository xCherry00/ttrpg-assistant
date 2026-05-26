import CharacterSheetView from "../CharacterSheetView";
import CocCharacterSheetView from "./coc/CocCharacterSheetView";

export default function CharacterSheetRouter({ detail, onSave, saving, readOnly = false }) {
  const systemCode = (detail?.systemCode || "").toLowerCase();
  if (systemCode === "dnd5e") {
    return <CharacterSheetView detail={detail} onSave={onSave} saving={saving} readOnly={readOnly} />;
  }
  if (systemCode === "coc7e") {
    return <CocCharacterSheetView detail={detail} onSave={onSave} saving={saving} readOnly={readOnly} />;
  }
  return <div className="charactersEmpty">Brak obsługi podglądu karty dla systemu: {detail?.systemCode || "nieznany"}.</div>;
}
