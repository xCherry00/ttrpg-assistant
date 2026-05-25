export default function SavingThrowsPanel({ savingThrows }) {
  const rows = Array.isArray(savingThrows) ? savingThrows : [];
  return (
    <section className="sheetSection">
      <h3>Rzuty obronne</h3>
      {rows.length === 0 && <div className="sheetEmpty">Brak danych rzutow obronnych.</div>}
      {rows.length > 0 && (
        <ul className="sheetSimpleList">
          {rows.map((row, index) => <li key={`${row}-${index}`}>{String(row)}</li>)}
        </ul>
      )}
    </section>
  );
}
