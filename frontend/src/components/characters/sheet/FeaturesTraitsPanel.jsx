function normalize(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (item && typeof item === "object") {
      return {
        title: item.name || item.title || "Cecha",
        text: item.description || item.text || "",
      };
    }
    return { title: String(item), text: "" };
  });
}

export default function FeaturesTraitsPanel({ featuresTraits }) {
  const rows = normalize(featuresTraits);
  return (
    <section className="sheetSection">
      <h3>Cechy i zdolnosci</h3>
      {rows.length === 0 && <div className="sheetEmpty">Brak cech i zdolnosci.</div>}
      {rows.length > 0 && (
        <div className="sheetStack">
          {rows.map((row, index) => (
            <details key={`${row.title}-${index}`} className="sheetDisclosure">
              <summary>{row.title}</summary>
              {row.text ? <p>{row.text}</p> : <p>Brak opisu.</p>}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
