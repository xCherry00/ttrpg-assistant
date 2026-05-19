export default function InventoryPanel({ inventory, onInventoryChange }) {
  return (
    <section className="sheetSection">
      <h3>Inventory</h3>
      <label className="sheetField">
        <span>One item per line</span>
        <textarea rows="7" value={inventory} onChange={(e) => onInventoryChange(e.target.value)} />
      </label>
    </section>
  );
}
