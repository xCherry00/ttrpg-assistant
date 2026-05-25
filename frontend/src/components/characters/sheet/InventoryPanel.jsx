export default function InventoryPanel({ inventory, onInventoryChange }) {
  return (
    <section className="sheetSection">
      <h3>Ekwipunek</h3>
      <label className="sheetField">
        <span>Jeden element na linie</span>
        <textarea rows="7" value={inventory} onChange={(e) => onInventoryChange(e.target.value)} />
      </label>
    </section>
  );
}
