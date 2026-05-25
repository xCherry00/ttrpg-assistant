function normalize(characteristics) {
  if (!characteristics || typeof characteristics !== "object") return [];
  return Object.entries(characteristics);
}

export default function CocCharacteristicsPanel({ characteristics }) {
  const rows = normalize(characteristics);
  return (
    <section className="sheetSection">
      <h3>Cechy</h3>
      {rows.length === 0 && <div className="sheetEmpty">Brak cech.</div>}
      {rows.length > 0 && (
        <table className="sheetTable">
          <thead>
            <tr><th>Cecha</th><th>Wartosc</th><th>1/2</th><th>1/5</th></tr>
          </thead>
          <tbody>
            {rows.map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value?.value ?? "-"}</td>
                <td>{value?.half ?? "-"}</td>
                <td>{value?.fifth ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
