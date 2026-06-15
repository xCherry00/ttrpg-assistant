export const CHARACTER_SYSTEMS = [
  {
    code: "dnd5e",
    name: "D&D 5e",
    status: "ready",
    description: "Szybki kreator postaci poziomu 1 z kartą startową.",
    enabled: true,
  },
  {
    code: "coc7e",
    name: "Zew Cthulhu 7e",
    status: "ready",
    description: "Szybki kreator badacza z podstawowymi statystykami CoC7e.",
    enabled: true,
  },
];

function statusLabel(status) {
  if (status === "ready") return "Gotowe";
  return "Wkrótce";
}

export default function CharacterSystemSelector({ systems = CHARACTER_SYSTEMS, onSelect }) {
  const visibleSystems = systems.filter((system) => system.enabled);
  return (
    <div className="charactersSystemSelector">
      {visibleSystems.map((system) => (
        <button
          key={system.code}
          type="button"
          className="charactersSystemCard"
          disabled={!system.enabled}
          onClick={() => onSelect(system.code)}
        >
          <span className={`charactersSystemBadge${system.enabled ? " is-ready" : ""}`}>{statusLabel(system.status)}</span>
          <strong>{system.name}</strong>
          <p>{system.description}</p>
        </button>
      ))}
    </div>
  );
}
