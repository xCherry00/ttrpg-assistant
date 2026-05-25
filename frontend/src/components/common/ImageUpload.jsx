import { useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { uploadImage } from "../../api/uploads";

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  label = "Obraz",
  helpText = "Dozwolone: JPG, PNG, WEBP (max 5 MB)",
  disabled = false,
  previewAlt = "Preview",
}) {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const uploaded = await uploadImage(token, file);
      onChange?.(uploaded.url || "");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err?.message || "Nie udalo sie wgrac pliku.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="imageUploadField">
      <label className="campaignField">
        <span>{label}</span>
        <input
          ref={inputRef}
          aria-label={label}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || loading}
          onChange={(e) => {
            setError("");
            setFile(e.target.files?.[0] || null);
          }}
        />
      </label>
      <small>{helpText}</small>
      {value ? (
        <div style={{ marginTop: 8 }}>
          <img src={value} alt={previewAlt} style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 10 }} />
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" className="campaignDetailsPrimaryBtn" onClick={handleUpload} disabled={!file || disabled || loading}>
          {loading ? "Wgrywanie..." : "Wgraj"}
        </button>
        <button type="button" className="campaignDetailsGhostBtn" onClick={() => onRemove?.()} disabled={disabled || loading}>
          Usuń
        </button>
      </div>
      {error ? <div className="campaignError" style={{ marginTop: 8 }}>{error}</div> : null}
    </div>
  );
}
