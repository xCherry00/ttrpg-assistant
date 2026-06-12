import { useEffect, useState } from "react";
import { getDndBackgrounds, getDndClasses, getDndRaces } from "../api/characters";
import { useAuth } from "../auth/AuthContext";
import ImageLibraryPicker from "./common/ImageLibraryPicker";
import { imagePlaceholder } from "../data/imageLibrary";

export default function QuickCharacterCreator({ onCreate, creating, onBack }) {
  const { token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [races, setRaces] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [form, setForm] = useState({
    name: "",
    raceIndex: "",
    classIndex: "",
    backgroundIndex: "",
    portraitUrl: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [c, r, b] = await Promise.all([getDndClasses(token), getDndRaces(token), getDndBackgrounds(token)]);
      if (cancelled) return;
      setClasses(c || []);
      setRaces(r || []);
      setBackgrounds(b || []);
      setForm((prev) => ({
        ...prev,
        classIndex: prev.classIndex || c?.[0]?.index || "",
        raceIndex: prev.raceIndex || r?.[0]?.index || "",
        backgroundIndex: prev.backgroundIndex || b?.[0]?.index || "",
      }));
    }
    load().catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="charactersQuickCreate">
      <div className="charactersGrid">
        <label className="charactersField"><span>Nazwa</span><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
        <label className="charactersField"><span>Rasa</span><select value={form.raceIndex} onChange={(e) => setForm((p) => ({ ...p, raceIndex: e.target.value }))}>{races.map((x) => <option key={x.index} value={x.index}>{x.name}</option>)}</select></label>
        <label className="charactersField"><span>Klasa</span><select value={form.classIndex} onChange={(e) => setForm((p) => ({ ...p, classIndex: e.target.value }))}>{classes.map((x) => <option key={x.index} value={x.index}>{x.name}</option>)}</select></label>
        <label className="charactersField"><span>Tlo</span><select value={form.backgroundIndex} onChange={(e) => setForm((p) => ({ ...p, backgroundIndex: e.target.value }))}>{backgrounds.map((x) => <option key={x.index} value={x.index}>{x.name}</option>)}</select></label>
      </div>

      <div className="charactersPortraitPicker">
        <div className="charactersPortraitPreview">
          <img src={form.portraitUrl || imagePlaceholder("characterAvatars")} alt="Podglad portretu" />
        </div>
        <div className="charactersPortraitControls">
          <div className="charactersEyebrow">Portret</div>
          <ImageLibraryPicker
            type="characterAvatars"
            label="Avatar postaci"
            value={form.portraitUrl}
            onChange={(src) => setForm((p) => ({ ...p, portraitUrl: src }))}
            onRemove={() => setForm((p) => ({ ...p, portraitUrl: "" }))}
            previewAlt="Portret postaci"
            helpText="Wybierz gotowy avatar postaci z biblioteki."
          />
        </div>
      </div>

      <div className="charactersActionsFooter">
        {onBack && <button type="button" className="charactersGhostBtn" disabled={creating} onClick={onBack}>Wróć do systemów</button>}
        <button type="button" className="charactersPrimaryBtn" disabled={creating || !form.name.trim()} onClick={() => onCreate(form)}>{creating ? "Tworzenie..." : "Utwórz postać"}</button>
      </div>
    </div>
  );
}

