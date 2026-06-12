import { imageLibraryItems, imagePlaceholder } from "../../data/imageLibrary";

export default function ImageLibraryPicker({
  type,
  value,
  onChange,
  onRemove,
  label = "Obraz",
  helpText = "Wybierz obraz z biblioteki.",
  disabled = false,
  previewAlt = "Podglad obrazu",
}) {
  const items = imageLibraryItems(type);
  const selected = items.find((item) => item.src === value) || null;
  const previewSrc = value || imagePlaceholder(type);

  return (
    <div className="imageLibraryPicker">
      <div className="imageLibraryPicker__head">
        <div>
          <span>{label}</span>
          <small>{helpText}</small>
        </div>
        {value ? (
          <button type="button" onClick={onRemove} disabled={disabled}>
            Usuń
          </button>
        ) : null}
      </div>

      {previewSrc ? (
        <div className="imageLibraryPicker__preview">
          <img src={previewSrc} alt={previewAlt} onError={(event) => { event.currentTarget.style.opacity = "0.25"; }} />
          <strong>{value ? selected?.label || "Wybrany obraz" : "Brak wyboru"}</strong>
        </div>
      ) : null}

      <div className="imageLibraryPicker__grid" role="listbox" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={item.src === value}
            className={item.src === value ? "is-selected" : ""}
            disabled={disabled}
            onClick={() => onChange?.(item.src)}
          >
            <img src={item.src} alt="" onError={(event) => { event.currentTarget.style.opacity = "0.25"; }} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
