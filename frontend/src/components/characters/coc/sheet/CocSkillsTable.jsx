export default function CocSkillsTable({ skills }) {
  const rows = Array.isArray(skills) ? skills : [];
  return (
    <section className="sheetSection">
      <h3>Umiejętności</h3>
      {rows.length === 0 && <div className="sheetEmpty">Brak umiejętności.</div>}
      {rows.length > 0 && (
        <table className="sheetTable">
          <thead>
            <tr><th>Umiejętność</th><th>Wartość</th><th>1/2</th><th>1/5</th></tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row?.key || row?.name || "skill"}-${index}`}>
                <td>{row?.name || "-"}</td>
                <td>{row?.value ?? "-"}</td>
                <td>{row?.half ?? "-"}</td>
                <td>{row?.fifth ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
