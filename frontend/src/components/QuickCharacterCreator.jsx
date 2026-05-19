import { useEffect, useState } from "react";
import { getDndBackgrounds, getDndClasses, getDndRaces } from "../api/characters";
import { useAuth } from "../auth/AuthContext";

const MAX_PORTRAIT_BYTES = 1800000;

function svgPortrait(label, from, to) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="${from}" />
          <stop offset="1" stop-color="${to}" />
        </linearGradient>
        <radialGradient id="r" cx="35%" cy="28%" r="58%">
          <stop stop-color="rgba(255,255,255,.75)" />
          <stop offset="1" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="72" fill="url(#g)" />
      <rect width="512" height="512" rx="72" fill="url(#r)" opacity=".55" />
      <circle cx="256" cy="194" r="82" fill="rgba(10,14,22,.52)" />
      <path d="M104 442c23-93 84-142 152-142s129 49 152 142" fill="rgba(10,14,22,.58)" />
      <text x="256" y="472" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="700" fill="rgba(255,247,230,.9)">${label}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const PORTRAIT_PRESETS = [
  { id: "warrior", label: "Wojownik", value: svgPortrait("Wojownik", "#7c2d12", "#d97706") },
  { id: "mage", label: "Mag", value: svgPortrait("Mag", "#1d4ed8", "#7c3aed") },
  { id: "rogue", label: "Lotrzyk", value: svgPortrait("Lotrzyk", "#111827", "#64748b") },
  { id: "cleric", label: "Kaplan", value: svgPortrait("Kaplan", "#92400e", "#facc15") },
];

export default function QuickCharacterCreator({ onCreate, creating, onBack }) {
  const { token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [races, setRaces] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [portraitSource, setPortraitSource] = useState("preset");
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    name: "",
    raceIndex: "",
    classIndex: "",
    backgroundIndex: "",
    portraitUrl: PORTRAIT_PRESETS[0].value,
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

  function selectPreset(value) {
    setLocalError("");
    setPortraitSource("preset");
    setForm((p) => ({ ...p, portraitUrl: value }));
  }

  function handleFile(file) {
    setLocalError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Wybierz plik obrazu.");
      return;
    }
    if (file.size > MAX_PORTRAIT_BYTES) {
      setLocalError("Obraz jest za duzy. Maksymalnie ok. 1.8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPortraitSource("file");
      setForm((p) => ({ ...p, portraitUrl: String(reader.result || "") }));
    };
    reader.onerror = () => setLocalError("Nie udalo sie wczytac obrazu.");
    reader.readAsDataURL(file);
  }

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
          {form.portraitUrl ? <img src={form.portraitUrl} alt="Podglad portretu" /> : <span>Portret</span>}
        </div>
        <div className="charactersPortraitControls">
          <div className="charactersEyebrow">Portret</div>
          <div className="charactersPortraitTabs">
            <button type="button" className={`charactersGhostBtn${portraitSource === "preset" ? " is-active" : ""}`} onClick={() => setPortraitSource("preset")}>Gotowe</button>
            <button type="button" className={`charactersGhostBtn${portraitSource === "file" ? " is-active" : ""}`} onClick={() => setPortraitSource("file")}>Z PC</button>
            <button type="button" className={`charactersGhostBtn${portraitSource === "url" ? " is-active" : ""}`} onClick={() => setPortraitSource("url")}>URL</button>
          </div>

          {portraitSource === "preset" && (
            <div className="charactersPortraitPresets">
              {PORTRAIT_PRESETS.map((preset) => (
                <button key={preset.id} type="button" className={`charactersPortraitPreset${form.portraitUrl === preset.value ? " is-active" : ""}`} onClick={() => selectPreset(preset.value)}>
                  <img src={preset.value} alt="" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          )}

          {portraitSource === "file" && (
            <label className="charactersField">
              <span>Plik z komputera</span>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
          )}

          {portraitSource === "url" && (
            <label className="charactersField">
              <span>Adres obrazu</span>
              <input value={form.portraitUrl} onChange={(e) => setForm((p) => ({ ...p, portraitUrl: e.target.value }))} />
            </label>
          )}

          {localError && <div className="charactersError">{localError}</div>}
        </div>
      </div>

      <div className="charactersActionsFooter">
        {onBack && <button type="button" className="charactersGhostBtn" disabled={creating} onClick={onBack}>Wroc do systemow</button>}
        <button type="button" className="charactersPrimaryBtn" disabled={creating || !form.name.trim()} onClick={() => onCreate(form)}>{creating ? "Tworzenie..." : "Utworz postac"}</button>
      </div>
    </div>
  );
}

