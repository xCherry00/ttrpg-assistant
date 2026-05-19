function normalizeAbilityEntries(abilityScores) {
  const defaults = ["str", "dex", "con", "int", "wis", "cha"];
  if (!abilityScores || typeof abilityScores !== "object") {
    return defaults.map((key) => [key, 0]);
  }
  const entries = Object.entries(abilityScores);
  if (entries.length === 0) {
    return defaults.map((key) => [key, 0]);
  }
  return entries;
}

export default function AbilityScoresPanel({ abilityScores }) {
  const entries = normalizeAbilityEntries(abilityScores);
  return (
    <section className="sheetSection">
      <h3>Ability Scores</h3>
      <div className="sheetAbilityGrid">
        {entries.map(([key, value]) => (
          <div key={key} className="sheetAbilityTile">
            <span>{key.toUpperCase()}</span>
            <strong>{value ?? 0}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
