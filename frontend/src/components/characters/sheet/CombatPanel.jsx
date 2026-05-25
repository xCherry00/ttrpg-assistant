function statValue(value, fallback = 0) {
  return value ?? fallback;
}

export default function CombatPanel({
  combat,
  currentHp,
  tempHp,
  onCurrentHpChange,
  onTempHpChange,
}) {
  const stats = [
    { label: "Maks. HP", value: statValue(combat?.maxHp) },
    { label: "AC", value: statValue(combat?.armorClass) },
    { label: "Predkosc", value: statValue(combat?.speed) },
    { label: "Inicjatywa", value: statValue(combat?.initiative) },
    { label: "Premia bieglosci", value: statValue(combat?.proficiencyBonus, 2) },
    { label: "Hit Dice", value: combat?.hitDice || "-" },
  ];

  return (
    <section className="sheetSection">
      <h3>Walka</h3>
      <div className="sheetStatsGrid">
        {stats.map((stat) => (
          <div key={stat.label} className="sheetStatTile">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
      <div className="sheetGrid">
        <label className="sheetField">
          <span>Aktualne HP</span>
          <input type="number" min="0" value={currentHp} onChange={(e) => onCurrentHpChange(Number(e.target.value || 0))} />
        </label>
        <label className="sheetField">
          <span>Tymczasowe HP</span>
          <input type="number" min="0" value={tempHp} onChange={(e) => onTempHpChange(Number(e.target.value || 0))} />
        </label>
      </div>
    </section>
  );
}
