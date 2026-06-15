import { useMemo, useState } from "react";
import { imagePlaceholder } from "../../data/imageLibrary";

function searchableText(item) {
  return [item?.name, item?.systemCode, item?.raceName, item?.className].filter(Boolean).join(" ").toLowerCase();
}

export default function CharacterSidebar({
  items,
  loading,
  selectedId,
  onSelect,
  onCreate,
  onImport,
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => searchableText(item).includes(normalized));
  }, [items, query]);

  return (
    <aside className="charactersSidebar">
      <div className="charactersSidebarHeader">
        <div>
          <h2>Postacie</h2>
          <p>{items.length} zapisanych</p>
        </div>
        <button type="button" className="charactersPrimaryBtn" onClick={onCreate}>+ Nowa postać</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="charactersGhostBtn" onClick={onImport}>Importuj JSON</button>
      </div>

      <label className="charactersSearch">
        <span>Szukaj</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nazwa, rasa, klasa..."
        />
      </label>

      <div className="charactersList">
        {loading && <div className="charactersState">Ładowanie listy postaci...</div>}
        {!loading && items.length === 0 && <div className="charactersEmptyRow">Nie masz jeszcze żadnej postaci.</div>}
        {filtered.length === 0 && <div className="charactersEmptyRow">Brak wyników.</div>}
        {!loading && filtered.map((item) => (
          <div key={item.id} className={`charactersCard${item.id === selectedId ? " is-active" : ""}`}>
            <button
              type="button"
              className="charactersCardSelect"
              onClick={() => onSelect(item.id)}
            >
              <div className="charactersCardPortrait">
                <img src={item.portraitUrl || imagePlaceholder("characterAvatars")} alt={`Portret ${item.name || "postaci"}`} />
              </div>
              <strong>{item.name || "Bez nazwy"}</strong>
              <div>{item.systemCode?.toUpperCase() || "SYSTEM"}</div>
              <div>{item.raceName || "-"} / {item.className || "-"}</div>
              <div>Poziom {item.level ?? 1}</div>
              <div>Kampania: {item.campaignName || item.campaignTitle || "-"}</div>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
