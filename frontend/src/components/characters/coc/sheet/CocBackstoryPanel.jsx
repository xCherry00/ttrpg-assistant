export default function CocBackstoryPanel({ backstory }) {
  const entries = backstory && typeof backstory === "object" ? Object.entries(backstory) : [];
  return (
    <section className="sheetSection">
      <h3>Historia postaci</h3>
      {entries.length === 0 && <div className="sheetEmpty">Brak historii postaci.</div>}
      {entries.length > 0 && (
        <div className="sheetStack">
          {entries.map(([key, value]) => (
            <div key={key} className="sheetDisclosure">
              <strong>{key}</strong>
              <p>{value || "-"}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
