function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map((entry) => {
    if (entry && typeof entry === "object") {
      return {
        name: entry.name || entry.skill || "Nieznana",
        value: entry.value ?? entry.modifier ?? "-",
      };
    }
    return { name: String(entry), value: "-" };
  });
}

export default function SkillsTable({ skills }) {
  const rows = normalizeSkills(skills);
  return (
    <section className="sheetSection">
      <h3>Umiejetnosci</h3>
      {rows.length === 0 && <div className="sheetEmpty">Brak danych umiejetnosci.</div>}
      {rows.length > 0 && (
        <table className="sheetTable">
          <thead>
            <tr><th>Umiejetnosc</th><th>Wartosc</th></tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`}>
                <td>{row.name}</td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
