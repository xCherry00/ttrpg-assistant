import { useMemo, useState } from "react";
import "../styles/dice.css";

const MODES = [
  { value: "standard", label: "Standard" },
  { value: "fate", label: "Fate / Fudge" },
  { value: "genesys", label: "Genesys / Narrative" },
];

const STANDARD_DICE = [4, 6, 8, 10, 12, 20, 100];
const ROLL_TYPES = [
  { value: "normal", label: "Zwykły" },
  { value: "advantage", label: "Advantage" },
  { value: "disadvantage", label: "Disadvantage" },
];

const FATE_LADDER = {
  "-2": "Słabo",
  "-1": "Słabo",
  0: "Przeciętnie",
  1: "Niezły",
  2: "Dobry",
  3: "Świetny",
  4: "Wybitny",
};

const DEFAULT_STANDARD_POOL = Object.fromEntries(STANDARD_DICE.map((die) => [die, die === 20 ? 1 : 0]));

const GENESYS_DICE = {
  ability: [{}, { success: 1 }, { success: 1 }, { advantage: 1 }, { advantage: 1 }, { success: 1, advantage: 1 }, { advantage: 2 }, { success: 2 }],
  proficiency: [{}, { success: 1 }, { success: 1 }, { success: 2 }, { success: 2 }, { advantage: 1 }, { success: 1, advantage: 1 }, { success: 1, advantage: 1 }, { success: 1, advantage: 1 }, { advantage: 2 }, { advantage: 2 }, { triumph: 1, success: 1 }],
  boost: [{}, {}, { success: 1 }, { advantage: 1 }, { advantage: 2 }, { success: 1, advantage: 1 }],
  difficulty: [{}, { failure: 1 }, { failure: 2 }, { threat: 1 }, { threat: 1 }, { threat: 1 }, { threat: 2 }, { failure: 1, threat: 1 }],
  challenge: [{}, { failure: 1 }, { failure: 1 }, { failure: 2 }, { failure: 2 }, { threat: 1 }, { threat: 1 }, { failure: 1, threat: 1 }, { failure: 1, threat: 1 }, { threat: 2 }, { threat: 2 }, { despair: 1, failure: 1 }],
  setback: [{}, {}, { failure: 1 }, { failure: 1 }, { threat: 1 }, { threat: 1 }],
};

const GENESYS_LABELS = {
  ability: "Zdolność",
  proficiency: "Biegłość",
  boost: "Wsparcie",
  difficulty: "Trudność",
  challenge: "Wyzwanie",
  setback: "Utrudnienie",
};

const GENESYS_DIE_META = {
  ability: { symbol: "success", tone: "good" },
  proficiency: { symbol: "triumph", tone: "good" },
  boost: { symbol: "advantage", tone: "good" },
  difficulty: { symbol: "failure", tone: "bad" },
  challenge: { symbol: "despair", tone: "bad" },
  setback: { symbol: "threat", tone: "bad" },
};

const GENESYS_SYMBOLS = {
  success: { label: "Sukces", color: "green" },
  advantage: { label: "Przewaga", color: "violet" },
  triumph: { label: "Triumf", color: "gold" },
  failure: { label: "Porażka", color: "red" },
  threat: { label: "Zagrożenie", color: "slate" },
  despair: { label: "Rozpacz", color: "black" },
};

const GENESYS_RESULT_WORDS = {
  success: ["Sukces", "Sukcesy"],
  advantage: ["Przewaga", "Przewagi"],
  triumph: ["Triumf", "Triumfy"],
  failure: ["Porażka", "Porażki"],
  threat: ["Zagrożenie", "Zagrożenia"],
  despair: ["Rozpacz", "Rozpacze"],
};

function clampInt(value, min, max) {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : min;
}

function id() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function nowLabel() {
  return new Date().toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

function modeLabel(mode) {
  return MODES.find((item) => item.value === mode)?.label || mode;
}

function rollTypeLabel(rollType) {
  return ROLL_TYPES.find((item) => item.value === rollType)?.label || rollType;
}

function signed(value) {
  const number = Number(value) || 0;
  if (number === 0) return "0";
  return `${number > 0 ? "+" : "-"}${Math.abs(number)}`;
}

function standardDicePoolEntries(pool = {}) {
  return STANDARD_DICE
    .map((die) => ({ die, count: clampInt(pool[die] || 0, 0, 100) }))
    .filter((item) => item.count > 0);
}

function formatStandardDicePool(pool = {}) {
  const entries = standardDicePoolEntries(pool);
  if (!entries.length) return "Brak kości";
  return entries.map(({ count, die }) => `${count}k${die}`).join(" + ");
}

function formatStandardFormula(pool = {}, modifier = 0, rollType = "normal") {
  const dice = formatStandardDicePool(pool);
  const mod = Number(modifier) ? ` ${Number(modifier) > 0 ? "+" : "-"} ${Math.abs(Number(modifier))}` : "";
  const suffix = rollType === "normal" ? "" : ` (${rollTypeLabel(rollType)})`;
  return `${dice}${mod}${suffix}`;
}

function fateFormula(qty, modifier) {
  const mod = Number(modifier) || 0;
  if (!mod) return `${qty}dF`;
  return `${qty}dF ${mod > 0 ? "+" : "-"} ${Math.abs(mod)}`;
}

function genesysFormula(pool) {
  return Object.entries(pool)
    .filter(([, count]) => Number(count) > 0)
    .map(([key, count]) => `${count} ${GENESYS_LABELS[key]}`)
    .join(", ") || "Pula narracyjna";
}

function rollFateDie() {
  return [-1, -1, 0, 0, 1, 1][Math.floor(Math.random() * 6)];
}

function fateSymbol(value) {
  if (value > 0) return "+";
  if (value < 0) return "-";
  return "0";
}

function fateDescription(total) {
  if (total <= -1) return "Słabo";
  if (total >= 4) return "Świetny";
  return FATE_LADDER[total] || "Przeciętnie";
}

function emptySymbols() {
  return { success: 0, failure: 0, advantage: 0, threat: 0, triumph: 0, despair: 0 };
}

function addSymbols(target, source = {}) {
  Object.keys(target).forEach((key) => {
    target[key] += Number(source[key] || 0);
  });
}

function genesysNetItems(entry) {
  if (!entry) return [];
  return [
    { key: "success", count: entry.netSuccess || 0 },
    { key: "failure", count: entry.netFailure || 0 },
    { key: "advantage", count: entry.netAdvantage || 0 },
    { key: "threat", count: entry.netThreat || 0 },
    { key: "triumph", count: entry.triumph || 0 },
    { key: "despair", count: entry.despair || 0 },
  ].filter((item) => item.count > 0);
}

function genesysCountLabel(item) {
  const words = GENESYS_RESULT_WORDS[item.key] || [GENESYS_SYMBOLS[item.key]?.label || item.key, GENESYS_SYMBOLS[item.key]?.label || item.key];
  return `${item.count} ${item.count === 1 ? words[0] : words[1]}`;
}

function genesysSummary(entry) {
  const items = genesysNetItems(entry);
  if (!items.length) return "Wynik neutralny";
  return items.map(genesysCountLabel).join(", ");
}

function interpretGenesys(entry) {
  if (entry.netSuccess > 0 && entry.netAdvantage > 0) return "Akcja udana z dodatkową korzyścią.";
  if (entry.netSuccess > 0 && entry.netThreat > 0) return "Akcja udana, ale z komplikacją.";
  if (entry.netFailure > 0 && entry.netAdvantage > 0) return "Akcja nieudana, ale pojawia się korzystny efekt uboczny.";
  if (entry.netFailure > 0 && entry.netThreat > 0) return "Akcja nieudana i pojawia się komplikacja.";
  if (entry.netSuccess > 0) return "Akcja udana.";
  if (entry.netFailure > 0) return "Akcja nieudana.";
  return "Wynik neutralny albo remisowy.";
}

function standardBreakdown(entry) {
  const dice = entry.selectedTotal ?? entry.diceTotal;
  const mod = entry.modifier ? ` ${entry.modifier > 0 ? "+" : "-"} ${Math.abs(entry.modifier)}` : "";
  const selected = entry.selectedTotal ? `, wybrano ${entry.selectedTotal}` : "";
  const dropped = entry.droppedTotal ? `, odrzucono ${entry.droppedTotal}` : "";
  return `${dice}${mod}${selected}${dropped}`;
}

export default function DicePage() {
  const [mode, setMode] = useState("standard");
  const [lastRoll, setLastRoll] = useState(null);
  const [standard, setStandard] = useState({ dicePool: DEFAULT_STANDARD_POOL, modifier: 0, rollType: "normal" });
  const [fate, setFate] = useState({ qty: 4, modifier: 0 });
  const [genesysPool, setGenesysPool] = useState({ ability: 0, proficiency: 0, boost: 0, difficulty: 0, challenge: 0, setback: 0 });

  const currentFormula = useMemo(() => {
    if (mode === "fate") return fateFormula(fate.qty, fate.modifier);
    if (mode === "genesys") return genesysFormula(genesysPool);
    return formatStandardFormula(standard.dicePool, standard.modifier, standard.rollType);
  }, [fate, genesysPool, mode, standard]);

  function completeRoll(entry) {
    setLastRoll(entry);
  }

  function rollStandard() {
    const modifier = clampInt(standard.modifier, -9999, 9999);
    const dicePool = Object.fromEntries(STANDARD_DICE.map((die) => [die, clampInt(standard.dicePool?.[die] || 0, 0, 100)]));
    const poolEntries = standardDicePoolEntries(dicePool);
    if (!poolEntries.length) return;
    const isAdv = standard.rollType === "advantage" || standard.rollType === "disadvantage";
    const rollPool = () => poolEntries.flatMap(({ die, count }) => (
      Array.from({ length: count }, () => ({ die, value: rollDie(die) }))
    ));
    const rollSets = isAdv ? [rollPool(), rollPool()] : [rollPool()];
    const setTotals = rollSets.map((set) => set.reduce((sum, item) => sum + item.value, 0));
    const selectedIndex = isAdv
      ? standard.rollType === "advantage"
        ? (setTotals[0] >= setTotals[1] ? 0 : 1)
        : (setTotals[0] <= setTotals[1] ? 0 : 1)
      : 0;
    const droppedIndex = isAdv ? (selectedIndex === 0 ? 1 : 0) : null;
    const rolls = rollSets[selectedIndex];
    const droppedRolls = droppedIndex === null ? [] : rollSets[droppedIndex];
    const selectedTotal = isAdv ? setTotals[selectedIndex] : null;
    const droppedTotal = droppedIndex === null ? null : setTotals[droppedIndex];
    const diceTotal = setTotals[selectedIndex];
    const total = diceTotal + modifier;
    const hasCriticalDie = rolls.some((item) => item.die === 20);
    completeRoll({
      id: id(),
      mode: "standard",
      modeLabel: "Standard",
      formula: formatStandardFormula(dicePool, modifier, standard.rollType),
      dicePool,
      rolls,
      droppedRolls,
      modifier,
      rollType: standard.rollType,
      selectedTotal,
      droppedTotal,
      diceTotal,
      total,
      isCritical: hasCriticalDie && rolls.some((item) => item.die === 20 && item.value === 20),
      isFumble: hasCriticalDie && rolls.some((item) => item.die === 20 && item.value === 1) && !rolls.some((item) => item.die === 20 && item.value === 20),
      timestamp: nowLabel(),
    });
  }

  function rollFate() {
    const qty = clampInt(fate.qty, 1, 20);
    const modifier = clampInt(fate.modifier, -20, 20);
    const numericRolls = Array.from({ length: qty }, rollFateDie);
    const diceTotal = numericRolls.reduce((sum, value) => sum + value, 0);
    const total = diceTotal + modifier;
    completeRoll({
      id: id(),
      mode: "fate",
      modeLabel: "Fate / Fudge",
      formula: fateFormula(qty, modifier),
      numericRolls,
      fateRolls: numericRolls.map(fateSymbol),
      diceTotal,
      modifier,
      total,
      ladderLabel: fateDescription(total),
      timestamp: nowLabel(),
    });
  }

  function rollGenesys() {
    const dicePool = Object.fromEntries(Object.entries(GENESYS_LABELS).map(([key]) => [key, clampInt(genesysPool[key] || 0, 0, 20)]));
    const rawSymbols = emptySymbols();
    Object.entries(dicePool).forEach(([dieKey, count]) => {
      const sides = GENESYS_DICE[dieKey] || [];
      for (let i = 0; i < count; i += 1) {
        addSymbols(rawSymbols, sides[Math.floor(Math.random() * sides.length)]);
      }
    });
    const successTotal = rawSymbols.success + rawSymbols.triumph;
    const failureTotal = rawSymbols.failure + rawSymbols.despair;
    const entry = {
      id: id(),
      mode: "genesys",
      modeLabel: "Genesys / Narrative",
      dicePool,
      rawSymbols,
      netSuccess: Math.max(0, successTotal - failureTotal),
      netFailure: Math.max(0, failureTotal - successTotal),
      netAdvantage: Math.max(0, rawSymbols.advantage - rawSymbols.threat),
      netThreat: Math.max(0, rawSymbols.threat - rawSymbols.advantage),
      triumph: rawSymbols.triumph,
      despair: rawSymbols.despair,
      timestamp: nowLabel(),
    };
    entry.interpretation = interpretGenesys(entry);
    completeRoll(entry);
  }

  function rollCurrent() {
    if (mode === "fate") return rollFate();
    if (mode === "genesys") return rollGenesys();
    return rollStandard();
  }

  const activeRoll = lastRoll?.mode === mode ? lastRoll : null;

  return (
    <div className="page dicePage">
      <div className="diceWorkbench">
        <main className="diceMainPanel">
          <DiceCommandBar formula={currentFormula} mode={mode} setMode={setMode} onRoll={rollCurrent} onClear={() => setLastRoll(null)} />
          {mode === "standard" && <StandardRollView config={standard} roll={activeRoll} />}
          {mode === "fate" && <FateRollView config={fate} roll={activeRoll} />}
          {mode === "genesys" && <GenesysRollView pool={genesysPool} roll={activeRoll} />}
        </main>
        <aside className="diceSidePanel">
          <DiceConfigPanel
            mode={mode}
            setMode={setMode}
            standard={standard}
            setStandard={setStandard}
            fate={fate}
            setFate={setFate}
            genesysPool={genesysPool}
            setGenesysPool={setGenesysPool}
          />
        </aside>
      </div>
    </div>
  );
}

function DiceCommandBar({ formula, mode, setMode, onRoll, onClear }) {
  return (
    <section className="diceCommandPanel" aria-label="Komenda rzutu">
      <div className="diceFormulaBox">
        <span>Aktualna formuła</span>
        <strong>{formula}</strong>
      </div>
      <div className="diceActionRow">
        <button type="button" className="dicePrimaryBtn" onClick={onRoll}>Rzuć</button>
        <button type="button" className="diceGhostBtn" onClick={onClear}>Wyczyść</button>
      </div>
      <div className="diceModeTabs" role="tablist" aria-label="Tryb rzutu">
        {MODES.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={mode === item.value} className={mode === item.value ? "is-active" : ""} onClick={() => setMode(item.value)}>
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function StandardRollView({ config, roll }) {
  return (
    <section className="diceCard diceResultPanel">
      <ResultHeader title="Wynik" subtitle="Standardowy rzut kośćmi" />
      <div className="diceResultHero">
        <div className="diceBigNumber">{roll ? roll.total : "-"}</div>
        <div className="diceBreakdown">{roll ? standardBreakdown(roll) : "Ustaw parametry i wykonaj rzut."}</div>
      </div>
      <div className="diceDiceStage">
        {roll ? roll.rolls.map((item, index) => (
          <StandardDie key={`${item.die}-${item.value}-${index}`} value={item.value} die={item.die} selected />
        )) : <div className="diceEmptyStage">Brak rzutu.</div>}
      </div>
      <SummaryGrid items={[
        ["Pula kości", formatStandardDicePool(config.dicePool)],
        ["Liczba kości", standardDicePoolEntries(config.dicePool).reduce((sum, item) => sum + item.count, 0)],
        ["Modyfikator", signed(config.modifier)],
        ["Typ rzutu", rollTypeLabel(config.rollType)],
      ]} />
    </section>
  );
}

function FateRollView({ config, roll }) {
  return (
    <section className="diceCard diceResultPanel">
      <ResultHeader title="Wynik" subtitle="Fate / Fudge" />
      <div className="diceResultHero diceResultHero--fate">
        <div>
          <div className="diceBigNumber">{roll ? roll.total : "-"}</div>
          <div className="diceOutcomeText">{roll ? roll.ladderLabel : "Opis pojawi się po rzucie."}</div>
        </div>
        <div className="diceFateDice">
          {roll ? roll.fateRolls.map((symbol, index) => <span key={`${symbol}-${index}`} className={`diceFateDie is-${symbol === "+" ? "plus" : symbol === "-" ? "minus" : "zero"}`}>{symbol}</span>) : Array.from({ length: config.qty }, (_, index) => <span key={index} className="diceFateDie">0</span>)}
        </div>
      </div>
      <SummaryGrid items={[
        ["Kości Fate", config.qty],
        ["Modyfikator", signed(config.modifier)],
        ["Wynik surowy", roll ? roll.diceTotal : "-"],
        ["Wynik końcowy", roll ? roll.total : "-"],
        ["Opis", roll ? roll.ladderLabel : "-"],
      ]} />
    </section>
  );
}

function GenesysRollView({ pool, roll }) {
  const summary = roll ? genesysSummary(roll) : "Wynik pojawi się po rzucie.";
  return (
    <section className="diceCard diceResultPanel">
      <ResultHeader title="Wynik" subtitle="Genesys / Narrative" />
      <div className="diceGenesysResult">
        <div>
          <div className="diceGenesysHeadline">{summary}</div>
          <p>{roll ? roll.interpretation : "Zbuduj pulę kości i wykonaj rzut narracyjny."}</p>
        </div>
        <div className="diceGenesysSymbolGrid">
          {roll && genesysNetItems(roll).length ? genesysNetItems(roll).map((item) => (
            <div key={item.key} className="diceGenesysResultItem">
              <GenesysSymbol type={item.key} />
              <span>{item.label}</span>
              <strong>x{item.count}</strong>
            </div>
          )) : <div className="diceEmptyStage">Brak symboli.</div>}
        </div>
      </div>
      <SummaryGrid items={[
        ["Zdolność", pool.ability],
        ["Biegłość", pool.proficiency],
        ["Wsparcie", pool.boost],
        ["Trudność", pool.difficulty],
        ["Wyzwanie", pool.challenge],
        ["Utrudnienie", pool.setback],
        ["Wynik", summary],
      ]} />
    </section>
  );
}

function ResultHeader({ title, subtitle }) {
  return (
    <div className="diceSectionHeader">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function StandardDie({ value, die, selected }) {
  return (
    <div className={`diceStandardDie${selected ? " is-selected" : ""}`}>
      <strong>{value}</strong>
      <span>k{die}</span>
    </div>
  );
}

function SummaryGrid({ items }) {
  return (
    <div className="diceSummaryGrid">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value ?? "Brak danych"}</strong>
        </div>
      ))}
    </div>
  );
}

function DiceConfigPanel({ mode, setMode, standard, setStandard, fate, setFate, genesysPool, setGenesysPool }) {
  return (
    <section className="diceCard diceConfigPanel">
      <div className="diceSideHeader">
        <h2>Konfiguracja</h2>
        <p>{modeLabel(mode)}</p>
      </div>
      <label className="diceField">
        <span>Tryb kości</span>
        <select value={mode} onChange={(event) => setMode(event.target.value)} aria-label="Tryb kości">
          {MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      {mode === "standard" && (
        <>
          <div className="diceStandardPool">
            {STANDARD_DICE.map((die) => (
              <StandardDieControl
                key={die}
                die={die}
                value={standard.dicePool?.[die] || 0}
                onChange={(value) => setStandard((current) => ({
                  ...current,
                  dicePool: { ...current.dicePool, [die]: value },
                }))}
              />
            ))}
          </div>
          <NumberStepper label="Modyfikator" value={standard.modifier} min={-9999} max={9999} onChange={(value) => setStandard((current) => ({ ...current, modifier: value }))} />
          <div className="diceRollTypeGrid">
            {ROLL_TYPES.map((item) => (
              <button key={item.value} type="button" className={standard.rollType === item.value ? "is-active" : ""} onClick={() => setStandard((current) => ({ ...current, rollType: item.value }))}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
      {mode === "fate" && (
        <>
          <NumberStepper label="Liczba kości Fate" value={fate.qty} min={1} max={20} onChange={(value) => setFate((current) => ({ ...current, qty: value }))} />
          <NumberStepper label="Modyfikator" value={fate.modifier} min={-20} max={20} onChange={(value) => setFate((current) => ({ ...current, modifier: value }))} />
        </>
      )}
      {mode === "genesys" && (
        <div className="diceGenesysPool">
          {Object.entries(GENESYS_LABELS).map(([key, label]) => (
            <GenesysDieControl key={key} dieKey={key} label={label} value={genesysPool[key]} onChange={(value) => setGenesysPool((current) => ({ ...current, [key]: value }))} />
          ))}
        </div>
      )}
    </section>
  );
}

function StandardDieControl({ die, value, onChange }) {
  return (
    <div className="diceStandardDieControl">
      <span className="diceStandardDieBadge">k{die}</span>
      <strong>k{die}</strong>
      <NumberStepper label="" ariaLabel={`k${die}`} value={value} min={0} max={100} onChange={onChange} />
    </div>
  );
}

function NumberStepper({ label, ariaLabel, value, min, max, onChange }) {
  const controlLabel = ariaLabel || label || "wartość";
  return (
    <div className="diceStepper">
      <span>{label}</span>
      <div>
        <button type="button" aria-label={`Zmniejsz ${controlLabel}`} onClick={() => onChange(clampInt(value - 1, min, max))} disabled={value <= min}>-</button>
        <input type="number" value={value} min={min} max={max} onChange={(event) => onChange(clampInt(event.target.value, min, max))} />
        <button type="button" aria-label={`Zwiększ ${controlLabel}`} onClick={() => onChange(clampInt(value + 1, min, max))} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function GenesysDieControl({ dieKey, label, value, onChange }) {
  const meta = GENESYS_DIE_META[dieKey];
  return (
    <div className={`diceGenesysDieControl is-${meta.tone}`}>
      <span className="diceGenesysDieBadge"><GenesysSymbol type={meta.symbol} /></span>
      <strong>{label}</strong>
      <NumberStepper label="" ariaLabel={label} value={value} min={0} max={20} onChange={onChange} />
    </div>
  );
}

function GenesysSymbol({ type }) {
  const meta = GENESYS_SYMBOLS[type] || GENESYS_SYMBOLS.success;
  return (
    <span className={`genesysSymbol is-${meta.color}`} aria-label={meta.label} title={meta.label}>
      {type === "success" && <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" /></svg>}
      {type === "advantage" && <svg viewBox="0 0 24 24"><path d="M12 3l9 9-9 9-9-9 9-9Z" /></svg>}
      {type === "triumph" && <svg viewBox="0 0 24 24"><path d="M12 2l2.8 6 6.2.8-4.6 4.4 1.2 6.4L12 16.5 6.4 19.6l1.2-6.4L3 8.8 9.2 8 12 2Z" /></svg>}
      {type === "failure" && <svg viewBox="0 0 24 24"><path d="M12 21L3 5h18l-9 16Z" /></svg>}
      {type === "threat" && <svg viewBox="0 0 24 24"><path d="M12 20L4 6h16l-8 14Z" /><path d="M12 10v4" /></svg>}
      {type === "despair" && <svg viewBox="0 0 24 24"><path d="M5 6h14l-7 7-7-7Z" /><path d="M5 13h14l-7 7-7-7Z" /></svg>}
    </span>
  );
}

function GenesysSymbolLegend() {
  return (
    <div className="diceGenesysLegend">
      {Object.entries(GENESYS_SYMBOLS).map(([key, meta]) => (
        <span key={key}><GenesysSymbol type={key} /> {meta.label}</span>
      ))}
    </div>
  );
}
