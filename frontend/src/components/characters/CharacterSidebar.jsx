import { useMemo, useState } from "react";

function searchableText(item) {
  return [item?.name, item?.systemCode, item?.raceName, item?.className].filter(Boolean).join(" ").toLowerCase();
}

export default function CharacterSidebar({
  items,
  loading,
  selectedId,
  onSelect,
  onCreate,
  onExport,
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
        <button type="button" className="charactersPrimaryBtn" onClick={onCreate}>+ Nowa postac</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="charactersGhostBtn" onClick={onImport}>Importuj JSON</button>
        <button type="button" className="charactersGhostBtn" onClick={onExport} disabled={!selectedId}>Eksportuj JSON</button>
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
        {loading && <div className="charactersState">Ladowanie listy postaci...</div>}
        {!loading && items.length === 0 && <div className="charactersEmptyRow">Nie masz jeszcze zadnej postaci.</div>}
        {filtered.length === 0 && <div className="charactersEmptyRow">Brak wynikow.</div>}
        {!loading && filtered.map((item) => (
          <div key={item.id} className={`charactersCard${item.id === selectedId ? " is-active" : ""}`}>
            <button
              type="button"
              className="charactersCardSelect"
              onClick={() => onSelect(item.id)}
            >
              <strong>{item.name || "Bez nazwy"}</strong>
              <div>{item.systemCode?.toUpperCase() || "SYSTEM"}</div>
              <div>{item.raceName || "-"} / {item.className || "-"}</div>
              <div>Poziom {item.level ?? 1}</div>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
