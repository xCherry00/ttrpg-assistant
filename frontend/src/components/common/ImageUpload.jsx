import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { uploadImage } from "../../api/uploads";

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  label = "Obraz",
  helpText = "Dozwolone: JPG, PNG, WEBP (max 5 MB)",
  recommendedSize = "",
  disabled = false,
  previewAlt = "Preview",
  autoUpload = false,
}) {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedFileName = file?.name || "";
  const localPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const previewUrl = localPreviewUrl || value;

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  function validateFile(nextFile) {
    if (!nextFile) return "";
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(nextFile.type)) return "Nie udało się wgrać obrazu. Dozwolone formaty: JPG, PNG, WEBP.";
    if (nextFile.size > 5 * 1024 * 1024) return "Nie udało się wgrać obrazu. Maksymalny rozmiar pliku to 5 MB.";
    return "";
  }

  async function uploadSelectedFile(nextFile) {
    setLoading(true);
    setError("");
    try {
      const uploaded = await uploadImage(token, nextFile);
      onChange?.(uploaded.url || "");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Nie udało się wgrać obrazu. Sprawdź format lub rozmiar pliku.");
    } finally {
      setLoading(false);
    }
  }

  function selectFile(nextFile) {
    setError("");
    const validationError = validateFile(nextFile);
    if (validationError) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setError(validationError);
      return;
    }
    setFile(nextFile || null);
    if (autoUpload && nextFile) void uploadSelectedFile(nextFile);
  }

  async function handleUpload() {
    if (!file) return;
    await uploadSelectedFile(file);
  }

  return (
    <div className="imageUploadField">
      <div className="campaignField">
        <span>{label}</span>
        <label
          className={`imageUploadDropzone ${loading ? "is-loading" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (disabled || loading) return;
            selectFile(event.dataTransfer.files?.[0] || null);
          }}
        >
          <input
            ref={inputRef}
            aria-label={label}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || loading}
            onChange={(e) => {
              selectFile(e.target.files?.[0] || null);
            }}
          />
          <span className="imageUploadDropzone__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 16V6" />
              <path d="m8 10 4-4 4 4" />
              <path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 16.5c0-2.1 1.4-3.9 3.4-4.4A5.5 5.5 0 0 1 18 9.9a4.5 4.5 0 0 1 2 6.6Z" />
            </svg>
          </span>
          <strong>{loading ? "Wgrywanie obrazu..." : selectedFileName || "Wybierz plik albo przeciągnij obraz tutaj"}</strong>
          <small>JPG, PNG, WEBP, maks. 5 MB</small>
        </label>
      </div>

      {recommendedSize ? <small className="imageUploadRecommendedSize">{recommendedSize}</small> : null}
      <small>{helpText}</small>

      {previewUrl ? (
        <div className="imageUploadPreview">
          <img src={previewUrl} alt={previewAlt} />
        </div>
      ) : null}

      {(file || value) ? (
        <div className="imageUploadActions">
          {file && !autoUpload ? (
            <button type="button" className="campaignDetailsPrimaryBtn" onClick={handleUpload} disabled={disabled || loading}>
              {loading ? "Wgrywanie..." : "Wgraj"}
            </button>
          ) : null}
          {value || file ? (
            <button
              type="button"
              className="campaignDetailsGhostBtn"
              onClick={() => {
                setFile(null);
                setError("");
                if (inputRef.current) inputRef.current.value = "";
                onRemove?.();
              }}
              disabled={disabled || loading}
            >
              Usuń obraz
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <div className="campaignError imageUploadError">{error}</div> : null}
    </div>
  );
}
