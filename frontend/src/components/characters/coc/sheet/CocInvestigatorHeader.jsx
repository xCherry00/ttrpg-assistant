import ImageLibraryPicker from "../../../common/ImageLibraryPicker";
import { imagePlaceholder } from "../../../../data/imageLibrary";

export default function CocInvestigatorHeader({ identity, name, onNameChange, portraitUrl, onPortraitUrlChange, readOnly = false }) {
  const fullName = name || identity?.name || "Badacz";
  const portrait = portraitUrl || identity?.portraitUrl || imagePlaceholder("characterAvatars");
  return (
    <section className="sheetSection">
      <div className="sheetHeader">
        <div className="sheetPortrait">
          {portrait ? <img src={portrait} alt="Portret badacza" /> : <span>{fullName.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="sheetIdentityGrid">
          <label className="sheetField"><span>Nazwa</span><input value={name} readOnly={readOnly} onChange={(e) => onNameChange(e.target.value)} /></label>
          {!readOnly && (
            <div className="sheetField" style={{ gridColumn: "1 / -1" }}>
              <ImageLibraryPicker
                type="characterAvatars"
                label="Avatar postaci"
                value={portrait}
                onChange={onPortraitUrlChange}
                onRemove={() => onPortraitUrlChange("")}
                previewAlt="Portret badacza"
                helpText="Wybierz gotowy avatar postaci z biblioteki."
              />
            </div>
          )}
          <label className="sheetField"><span>Imię</span><input value={identity?.firstName || "-"} readOnly /></label>
          <label className="sheetField"><span>Nazwisko</span><input value={identity?.lastName || "-"} readOnly /></label>
          <label className="sheetField"><span>Wiek</span><input value={identity?.age ?? "-"} readOnly /></label>
          <label className="sheetField"><span>Płeć</span><input value={identity?.sex || "-"} readOnly /></label>
          <label className="sheetField"><span>Zawód</span><input value={identity?.occupation || "-"} readOnly /></label>
        </div>
      </div>
    </section>
  );
}
