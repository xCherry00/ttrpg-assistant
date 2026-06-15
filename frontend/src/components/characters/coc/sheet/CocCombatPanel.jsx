export default function CocCombatPanel({ combat }) {
  const weapons = Array.isArray(combat?.weapons) ? combat.weapons : [];
  return (
    <section className="sheetSection">
      <h3>Walka</h3>
      <div className="sheetGrid">
        <label className="sheetField"><span>Unik</span><input value={combat?.dodge ?? "-"} readOnly /></label>
      </div>
      {weapons.length === 0 && <div className="sheetEmpty">Brak danych o broni.</div>}
      {weapons.length > 0 && (
        <table className="sheetTable">
          <thead>
            <tr><th>Broń</th><th>Umiejętność</th><th>Obrażenia</th></tr>
          </thead>
          <tbody>
            {weapons.map((weapon, index) => (
              <tr key={`${weapon?.name || "weapon"}-${index}`}>
                <td>{weapon?.name || "-"}</td>
                <td>{weapon?.skill ?? "-"}</td>
                <td>{weapon?.damage || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
