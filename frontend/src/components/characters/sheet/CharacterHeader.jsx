import ImageUpload from "../../common/ImageUpload";

export default function CharacterHeader({
  detail,
  identity,
  name,
  onNameChange,
  portraitUrl,
  onPortraitUrlChange,
}) {
  const portrait = portraitUrl || identity?.portraitUrl || "";
  const fallbackInitial = (name || detail?.name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <section className="sheetSection">
      <div className="sheetHeader">
        <div className="sheetPortrait">
          {portrait ? <img src={portrait} alt="Portret postaci" /> : <span>{fallbackInitial}</span>}
        </div>
        <div className="sheetIdentityGrid">
          <label className="sheetField">
            <span>Name</span>
            <input value={name} onChange={(e) => onNameChange(e.target.value)} />
          </label>
          <label className="sheetField">
            <span>Portrait</span>
            <input value={portraitUrl} onChange={(e) => onPortraitUrlChange(e.target.value)} placeholder="URL lub data:image/..." />
          </label>
          <div className="sheetField" style={{ gridColumn: "1 / -1" }}>
            <ImageUpload
              label="Wgraj portret"
              value={portrait}
              onChange={onPortraitUrlChange}
              onRemove={() => onPortraitUrlChange("")}
              previewAlt="Portret postaci"
            />
          </div>
          <label className="sheetField">
            <span>Race</span>
            <input value={identity?.race || detail?.raceName || "-"} readOnly />
          </label>
          <label className="sheetField">
            <span>Class</span>
            <input value={identity?.className || detail?.className || "-"} readOnly />
          </label>
          <label className="sheetField">
            <span>Background</span>
            <input value={identity?.background || detail?.backgroundName || "-"} readOnly />
          </label>
          <label className="sheetField">
            <span>Level</span>
            <input value={detail?.level ?? 1} readOnly />
          </label>
        </div>
      </div>
    </section>
  );
}
