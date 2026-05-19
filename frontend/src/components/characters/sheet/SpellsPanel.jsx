function normalizeSpells(spells) {
  if (!Array.isArray(spells)) return [];
  return spells.map((spell) => {
    if (spell && typeof spell === "object") {
      return spell.name || spell.title || "Spell";
    }
    return String(spell);
  });
}

export default function SpellsPanel({ spells }) {
  const rows = normalizeSpells(spells);
  if (!Array.isArray(spells)) return null;
  return (
    <section className="sheetSection">
      <h3>Spells</h3>
      {rows.length === 0 && <div className="sheetEmpty">Brak zaklec na tym poziomie.</div>}
      {rows.length > 0 && (
        <ul className="sheetSimpleList">
          {rows.map((spell, index) => <li key={`${spell}-${index}`}>{spell}</li>)}
        </ul>
      )}
    </section>
  );
}
