export default function CocDerivedStatsPanel({ derived }) {
  const entries = [
    ["HP", derived?.hp],
    ["MP", derived?.mp],
    ["SAN", derived?.san],
    ["Luck", derived?.luck],
    ["Damage Bonus", derived?.damageBonus],
    ["Build", derived?.build],
    ["Move", derived?.move],
  ];
  return (
    <section className="sheetSection">
      <h3>Derived Stats</h3>
      <div className="sheetStatsGrid">
        {entries.map(([label, value]) => (
          <div key={label} className="sheetStatTile">
            <span>{label}</span>
            <strong>{value ?? "-"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
