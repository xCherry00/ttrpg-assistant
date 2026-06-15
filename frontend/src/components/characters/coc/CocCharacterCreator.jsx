import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { getCocOccupations } from "../../../api/characters";
import AppToast from "../../common/AppToast";
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
        if (!cancelled) setError("Nie udało się załadować zawodów CoC 7e.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="charactersQuickCreate">
      {loading && <div className="charactersState">Ładowanie zawodów...</div>}
      {error && <AppToast message={error} onClose={() => setError("")} />}
      {!loading && (
        <>
          <div className="charactersGrid">
            <label className="charactersField">
              <span>Imię</span>
              <input value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} />
            </label>
            <label className="charactersField">
              <span>Nazwisko</span>
              <input value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} />
            </label>
            <label className="charactersField">
              <span>Wiek</span>
              <input type="number" min="15" max="95" value={form.age} onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))} />
            </label>
            <label className="charactersField">
              <span>Płeć</span>
              <input value={form.sex} onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value }))} />
            </label>
            <label className="charactersField">
              <span>Zawód</span>
              <select value={form.occupationIndex} onChange={(event) => setForm((prev) => ({ ...prev, occupationIndex: event.target.value }))}>
                {occupations.map((item) => <option key={item.index} value={item.index}>{item.name}</option>)}
              </select>
            </label>
            <ImageLibraryPicker
              type="characterAvatars"
              label="Avatar postaci"
              value={form.portraitUrl}
              onChange={(src) => setForm((prev) => ({ ...prev, portraitUrl: src }))}
              onRemove={() => setForm((prev) => ({ ...prev, portraitUrl: "" }))}
              previewAlt="Portret badacza"
              helpText="Wybierz gotowy avatar postaci z biblioteki."
            />
          </div>
          <div className="charactersActionsFooter">
            {onBack && (
              <button type="button" className="charactersGhostBtn" disabled={creating} onClick={onBack}>
                Wróć do systemów
              </button>
            )}
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
