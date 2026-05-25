import CharacterSheetView from "../CharacterSheetView";
import CocCharacterSheetView from "./coc/CocCharacterSheetView";

export default function CharacterSheetRouter({ detail, onSave, saving }) {
  const systemCode = (detail?.systemCode || "").toLowerCase();
  if (systemCode === "dnd5e") {
    return <CharacterSheetView detail={detail} onSave={onSave} saving={saving} />;
  }
  if (systemCode === "coc7e") {
    return <CocCharacterSheetView detail={detail} onSave={onSave} saving={saving} />;
  }
  return <div className="charactersEmpty">Brak obslugi podgladu karty dla systemu: {detail?.systemCode || "nieznany"}.</div>;
}
