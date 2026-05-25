import ImageUpload from "../../../common/ImageUpload";

export default function CocInvestigatorHeader({ identity, name, onNameChange, portraitUrl, onPortraitUrlChange }) {
  const fullName = name || identity?.name || "Investigator";
  const portrait = portraitUrl || identity?.portraitUrl || "";
  return (
    <section className="sheetSection">
      <div className="sheetHeader">
        <div className="sheetPortrait">
          {portrait ? <img src={portrait} alt="Investigator portrait" /> : <span>{fullName.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="sheetIdentityGrid">
          <label className="sheetField"><span>Name</span><input value={name} onChange={(e) => onNameChange(e.target.value)} /></label>
          <label className="sheetField"><span>Portrait</span><input value={portraitUrl} onChange={(e) => onPortraitUrlChange(e.target.value)} /></label>
          <div className="sheetField" style={{ gridColumn: "1 / -1" }}>
            <ImageUpload
              label="Wgraj portret"
              value={portrait}
              onChange={onPortraitUrlChange}
              onRemove={() => onPortraitUrlChange("")}
              previewAlt="Portret badacza"
            />
          </div>
          <label className="sheetField"><span>First Name</span><input value={identity?.firstName || "-"} readOnly /></label>
          <label className="sheetField"><span>Last Name</span><input value={identity?.lastName || "-"} readOnly /></label>
          <label className="sheetField"><span>Age</span><input value={identity?.age ?? "-"} readOnly /></label>
          <label className="sheetField"><span>Sex</span><input value={identity?.sex || "-"} readOnly /></label>
          <label className="sheetField"><span>Occupation</span><input value={identity?.occupation || "-"} readOnly /></label>
        </div>
      </div>
    </section>
  );
}
