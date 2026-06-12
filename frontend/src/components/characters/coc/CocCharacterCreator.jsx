import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { getCocOccupations } from "../../../api/characters";
import ImageLibraryPicker from "../../common/ImageLibraryPicker";

export default function CocCharacterCreator({ onCreate, creating, onBack }) {
  const { token } = useAuth();
  const [occupations, setOccupations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    sex: "",
    occupationIndex: "",
    portraitUrl: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const items = await getCocOccupations(token);
        if (cancelled) return;
        const next = Array.isArray(items) ? items : [];
        setOccupations(next);
        setForm((prev) => ({
          ...prev,
          occupationIndex: prev.occupationIndex || next[0]?.index || "",
        }));
      } catch {
        if (!cancelled) setError("Nie udalo sie zaladowac zawodów CoC 7e.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="charactersQuickCreate">
      {loading && <div className="charactersState">Ładowanie zawodów...</div>}
      {error && <div className="charactersError">{error}</div>}
      {!loading && (
        <>
          <div className="charactersGrid">
            <label className="charactersField"><span>First Name</span><input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} /></label>
            <label className="charactersField"><span>Last Name</span><input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></label>
            <label className="charactersField"><span>Age</span><input type="number" min="15" max="95" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} /></label>
            <label className="charactersField"><span>Sex</span><input value={form.sex} onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))} /></label>
            <label className="charactersField"><span>Occupation</span><select value={form.occupationIndex} onChange={(e) => setForm((p) => ({ ...p, occupationIndex: e.target.value }))}>{occupations.map((item) => <option key={item.index} value={item.index}>{item.name}</option>)}</select></label>
            <ImageLibraryPicker
              type="characterAvatars"
              label="Avatar postaci"
              value={form.portraitUrl}
              onChange={(src) => setForm((p) => ({ ...p, portraitUrl: src }))}
              onRemove={() => setForm((p) => ({ ...p, portraitUrl: "" }))}
              previewAlt="Portret badacza"
              helpText="Wybierz gotowy avatar postaci z biblioteki."
            />
          </div>
          <div className="charactersActionsFooter">
            {onBack && <button type="button" className="charactersGhostBtn" disabled={creating} onClick={onBack}>Wróć do systemów</button>}
            <button
              type="button"
              className="charactersPrimaryBtn"
              disabled={creating || !form.occupationIndex}
              onClick={() => onCreate({
                firstName: form.firstName || null,
                lastName: form.lastName || null,
                age: form.age ? Number(form.age) : null,
                sex: form.sex || null,
                occupationIndex: form.occupationIndex || null,
                portraitUrl: form.portraitUrl || null,
              })}
            >
              {creating ? "Tworzenie..." : "Utwórz badacza"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
