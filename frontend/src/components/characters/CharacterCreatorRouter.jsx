import QuickCharacterCreator from "../QuickCharacterCreator";
import CocCharacterCreator from "./coc/CocCharacterCreator";

export default function CharacterCreatorRouter({
  systemCode,
  creating,
  onCreateDnd,
  onCreateCoc,
  onBack,
}) {
  if (systemCode === "dnd5e") {
    return <QuickCharacterCreator onCreate={onCreateDnd} creating={creating} onBack={onBack} />;
  }
  if (systemCode === "coc7e") {
    return <CocCharacterCreator onCreate={onCreateCoc} creating={creating} onBack={onBack} />;
  }
  return <div className="charactersEmpty">Brak obslugi kreatora dla wybranego systemu.</div>;
}
