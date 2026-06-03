import ImageLibraryPicker from "../../common/ImageLibraryPicker";
import { imagePlaceholder } from "../../../data/imageLibrary";

export default function CharacterHeader({
  detail,
  identity,
  name,
  onNameChange,
  portraitUrl,
  onPortraitUrlChange,
  readOnly = false,
}) {
  const portrait = portraitUrl || identity?.portraitUrl || imagePlaceholder("characterAvatars");
  const fallbackInitial = (name || detail?.name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <section className="sheetSection">
      <div className="sheetHeader">
        <div className="sheetPortrait">
          {portrait ? <img src={portrait} alt="Portret postaci" /> : <span>{fallbackInitial}</span>}
        </div>
        <div className="sheetIdentityGrid">
          <label className="sheetField">
            <span>Nazwa</span>
            <input value={name} readOnly={readOnly} onChange={(e) => onNameChange(e.target.value)} />
          </label>
          {!readOnly && (
            <div className="sheetField" style={{ gridColumn: "1 / -1" }}>
              <ImageLibraryPicker
                type="characterAvatars"
                label="Avatar postaci"
                value={portrait}
                onChange={onPortraitUrlChange}
                onRemove={() => onPortraitUrlChange("")}
                previewAlt="Portret postaci"
                helpText="Wybierz gotowy avatar postaci z biblioteki."
              />
            </div>
          )}
          <label className="sheetField">
            <span>Rasa</span>
            <input value={identity?.race || detail?.raceName || "-"} readOnly />
          </label>
          <label className="sheetField">
            <span>Klasa</span>
            <input value={identity?.className || detail?.className || "-"} readOnly />
          </label>
          <label className="sheetField">
            <span>Pochodzenie</span>
            <input value={identity?.background || detail?.backgroundName || "-"} readOnly />
          </label>
          <label className="sheetField">
            <span>Poziom</span>
            <input value={detail?.level ?? 1} readOnly />
          </label>
        </div>
      </div>
    </section>
  );
}
