export const CHARACTER_SYSTEMS = [
  {
    code: "dnd5e",
    name: "D&D 5e",
    status: "ready",
    description: "Quick creator poziomu 1 z karta startowa.",
    enabled: true,
  },
  {
    code: "generic",
    name: "Uniwersalny TTRPG",
    status: "coming_soon",
    description: "Tryb uniwersalny bedzie dostepny w kolejnym etapie.",
    enabled: false,
  },
  {
    code: "coc7e",
    name: "Zew Cthulhu 7e",
    status: "ready",
    description: "Szybki kreator badacza z podstawowymi statystykami CoC7e.",
    enabled: true,
  },
  {
    code: "morkborg",
    name: "Mork Borg",
    status: "coming_soon",
    description: "Mroczny, szybki kreator bedzie dodany pozniej.",
    enabled: false,
  },
];

function statusLabel(status) {
  if (status === "ready") return "Gotowe";
  return "Wkrotce";
}

export default function CharacterSystemSelector({ systems = CHARACTER_SYSTEMS, onSelect }) {
  return (
    <div className="charactersSystemSelector">
      {systems.map((system) => (
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
