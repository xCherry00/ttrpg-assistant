export default function CocEquipmentPanel({ equipment, inventory, onInventoryChange }) {
  const items = Array.isArray(equipment?.items) ? equipment.items : [];
  return (
    <section className="sheetSection">
      <h3>Equipment</h3>
      <div className="sheetGrid">
        <label className="sheetField"><span>Cash</span><input value={equipment?.cash ?? "-"} readOnly /></label>
        <label className="sheetField"><span>Assets</span><input value={equipment?.assets ?? "-"} readOnly /></label>
        <label className="sheetField"><span>Spending Level</span><input value={equipment?.spendingLevel ?? "-"} readOnly /></label>
      </div>
      {items.length === 0 && <div className="sheetEmpty">Brak sugerowanego ekwipunku.</div>}
      {items.length > 0 && (
        <ul className="sheetSimpleList">
          {items.map((item, index) => <li key={`${item}-${index}`}>{String(item)}</li>)}
        </ul>
      )}
      <label className="sheetField">
        <span>Items (editable)</span>
        <textarea rows="7" value={inventory} onChange={(e) => onInventoryChange(e.target.value)} />
      </label>
    </section>
  );
}
