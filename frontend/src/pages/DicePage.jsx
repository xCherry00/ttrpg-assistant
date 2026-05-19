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
  { value: "advantage", label: "Przewaga" },
  { value: "disadvantage", label: "Utrudnienie" },
];

const FATE_LADDER = {
  "-2": "Fatalny",
  "-1": "Slaby",
  0: "Przecietny",
  1: "Niezly",
  2: "Dobry",
  3: "Bardzo dobry",
  4: "Swietny",
  5: "Znakomity",
  6: "Fantastyczny",
  7: "Epicki",
  8: "Legendarny",
};

const GENESYS_DICE = {
  ability: [{}, { success: 1 }, { success: 1 }, { advantage: 1 }, { advantage: 1 }, { success: 1, advantage: 1 }, { advantage: 2 }, { success: 2 }],
  proficiency: [{}, { success: 1 }, { success: 1 }, { success: 2 }, { success: 2 }, { advantage: 1 }, { success: 1, advantage: 1 }, { success: 1, advantage: 1 }, { success: 1, advantage: 1 }, { advantage: 2 }, { advantage: 2 }, { triumph: 1, success: 1 }],
  boost: [{}, {}, { success: 1 }, { advantage: 1 }, { advantage: 2 }, { success: 1, advantage: 1 }],
  difficulty: [{}, { failure: 1 }, { failure: 2 }, { threat: 1 }, { threat: 1 }, { threat: 1 }, { threat: 2 }, { failure: 1, threat: 1 }],
  challenge: [{}, { failure: 1 }, { failure: 1 }, { failure: 2 }, { failure: 2 }, { threat: 1 }, { threat: 1 }, { failure: 1, threat: 1 }, { failure: 1, threat: 1 }, { threat: 2 }, { threat: 2 }, { despair: 1, failure: 1 }],
  setback: [{}, {}, { failure: 1 }, { failure: 1 }, { threat: 1 }, { threat: 1 }],
};

const GENESYS_LABELS = {
  ability: "Ability",
  proficiency: "Proficiency",
  boost: "Boost",
  difficulty: "Difficulty",
  challenge: "Challenge",
  setback: "Setback",
};

const GENESYS_DIE_META = {
  ability: { mark: "A", tone: "positive" },
  proficiency: { mark: "P", tone: "positive" },
  boost: { mark: "B", tone: "positive" },
  difficulty: { mark: "D", tone: "negative" },
  challenge: { mark: "C", tone: "negative" },
  setback: { mark: "S", tone: "negative" },
};

const GENESYS_SYMBOLS = {
  success: { mark: "S", label: "Sukces" },
  failure: { mark: "F", label: "Porazka" },
  advantage: { mark: "A", label: "Przewaga" },
  threat: { mark: "T", label: "Zagrozenie" },
  triumph: { mark: "TR", label: "Triumf" },
  despair: { mark: "DS", label: "Rozpacz" },
};

function clampInt(value, min, max) {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : min;
}

function nowLabel() {
  return new Date().toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

function id() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function formatStandardFormula(groups, modifier = 0) {
  const parts = groups.map((group) => group.qty === 1 ? `k${group.die}` : `${group.qty}k${group.die}`);
  if (modifier) parts.push(`${modifier > 0 ? "+" : "-"} ${Math.abs(modifier)}`);
  return parts.join(" + ").replace("+ -", "-");
}

function fateFormula(qty, modifier) {
  const mod = Number(modifier) || 0;
  if (mod === 0) return `${qty}dF`;
  return `${qty}dF${mod > 0 ? "+" : ""}${mod}`;
}

function modeLabel(mode) {
  return MODES.find((item) => item.value === mode)?.label || mode;
}

function rollTypeLabel(rollType) {
  return ROLL_TYPES.find((item) => item.value === rollType)?.label || rollType;
}

function rollFateDie() {
  const sides = [-1, -1, 0, 0, 1, 1];
  return sides[Math.floor(Math.random() * sides.length)];
}

function fateSymbol(value) {
  if (value > 0) return "+";
  if (value < 0) return "-";
  return "0";
}

function emptySymbols() {
  return { success: 0, failure: 0, advantage: 0, threat: 0, triumph: 0, despair: 0 };
}

function addSymbols(target, source = {}) {
  Object.keys(target).forEach((key) => {
    target[key] += Number(source[key] || 0);
  });
}

function interpretGenesys(entry) {
  const lines = [];
  if (entry.netSuccess > 0 && entry.netAdvantage > 0) lines.push("Akcja udana z dodatkową korzyścią.");
  else if (entry.netSuccess > 0 && entry.netThreat > 0) lines.push("Akcja udana, ale z komplikacją.");
  else if (entry.netFailure > 0 && entry.netAdvantage > 0) lines.push("Akcja nieudana, ale pojawia się korzystny efekt uboczny.");
  else if (entry.netFailure > 0 && entry.netThreat > 0) lines.push("Akcja nieudana i pojawia się komplikacja.");
  else if (entry.netSuccess > 0) lines.push("Akcja udana.");
  else if (entry.netFailure > 0) lines.push("Akcja nieudana.");
  else lines.push("Wynik neutralny albo remisowy.");
  if (entry.triumph > 0) lines.push("Występuje potężny pozytywny zwrot narracyjny.");
  if (entry.despair > 0) lines.push("Występuje poważny negatywny zwrot narracyjny.");
  return lines.join(" ");
}

function standardBreakdown(entry) {
  if (Array.isArray(entry.rollDetails) && entry.rollDetails.length) {
    const dice = entry.rollDetails
      .map((group) => `${group.qty || group.rolls?.length || 1}k${group.die} [${(group.rolls || []).join(" + ")}]`)
      .join(" + ");
    return `${dice}${entry.modifier ? ` ${entry.modifier > 0 ? "+" : ""}${entry.modifier}` : ""}`;
  }
  const dropped = entry.droppedRoll ? `, odrzucono ${entry.droppedRoll}` : "";
  const selected = entry.selectedRoll ? `, wybrano ${entry.selectedRoll}` : "";
  return `${entry.rolls.join(" + ")}${entry.modifier ? ` ${entry.modifier > 0 ? "+" : ""}${entry.modifier}` : ""}${selected}${dropped}`;
}

function historyTitle(entry) {
  if (entry.mode === "genesys") return Object.entries(entry.dicePool).filter(([, count]) => count > 0).map(([key, count]) => `${count} ${GENESYS_LABELS[key]}`).join(" + ") || "Genesys";
  return entry.formula;
}

function historyTotal(entry) {
  if (entry.mode === "genesys") {
    if (entry.netSuccess > 0) return `+${entry.netSuccess} sukces`;
    if (entry.netFailure > 0) return `${entry.netFailure} porażka`;
    return "0";
  }
  return entry.total;
}

function historyBreakdown(entry) {
  if (entry.mode === "fate") return `${entry.fateRolls.join(" ")} | kości ${entry.diceTotal}, mod ${entry.modifier >= 0 ? "+" : ""}${entry.modifier}`;
  if (entry.mode === "genesys") return `S:${entry.netSuccess || 0} F:${entry.netFailure || 0} A:${entry.netAdvantage || 0} T:${entry.netThreat || 0} Triumph:${entry.triumph} Despair:${entry.despair}`;
  return standardBreakdown(entry);
}

function genesysSymbolItems(entry) {
  if (!entry?.rawSymbols) return [];
  return Object.entries(GENESYS_SYMBOLS)
    .map(([key, meta]) => ({ key, ...meta, value: Number(entry.rawSymbols[key] || 0) }))
    .filter((item) => item.value > 0);
}

function genesysNetItems(entry) {
  if (!entry) return [];
  return [
    { key: "netSuccess", label: "Sukcesy netto", value: entry.netSuccess || 0 },
    { key: "netFailure", label: "Porazki netto", value: entry.netFailure || 0 },
    { key: "netAdvantage", label: "Przewagi netto", value: entry.netAdvantage || 0 },
    { key: "netThreat", label: "Zagrozenia netto", value: entry.netThreat || 0 },
    { key: "triumph", label: "Triumf", value: entry.triumph || 0 },
    { key: "despair", label: "Rozpacz", value: entry.despair || 0 },
  ].filter((item) => item.value > 0);
}

export default function DicePage() {
  const [mode, setMode] = useState("standard");
  const [lastRoll, setLastRoll] = useState(null);

  const [standard, setStandard] = useState({ qty: 1, die: 20, modifier: 0, rollType: "normal" });
  const [fate, setFate] = useState({ qty: 4, modifier: 0 });
  const [genesysPool, setGenesysPool] = useState({ ability: 1, proficiency: 0, boost: 0, difficulty: 1, challenge: 0, setback: 0 });

  function completeRoll(entry) {
    setLastRoll(entry);
  }

  function rollStandard(override = {}) {
    const cfg = { ...standard, ...override };
    const rollType = cfg.rollType || "normal";
    const isAdvantage = rollType === "advantage" || rollType === "disadvantage";
    const modifier = clampInt(cfg.modifier, -9999, 9999);
    const die = clampInt(cfg.die, 2, 10000);
    const groups = isAdvantage
      ? [{ qty: 2, die }]
      : [{ qty: clampInt(cfg.qty, 1, 100), die }];
    const formulaText = isAdvantage
      ? `${formatStandardFormula(groups, modifier)} ${rollTypeLabel(rollType)}`
      : formatStandardFormula(groups, modifier);
    const rollDetails = groups.map((group) => ({
      ...group,
      rolls: Array.from({ length: group.qty }, () => rollDie(group.die)),
    }));
    const rolls = rollDetails.flatMap((group) => group.rolls);
    const lowerIsBetter = die === 100;
    const selectedRoll = isAdvantage
      ? rollType === "advantage"
        ? (lowerIsBetter ? Math.min(...rolls) : Math.max(...rolls))
        : (lowerIsBetter ? Math.max(...rolls) : Math.min(...rolls))
      : null;
    const droppedRoll = isAdvantage
      ? rollType === "advantage"
        ? (lowerIsBetter ? Math.max(...rolls) : Math.min(...rolls))
        : (lowerIsBetter ? Math.min(...rolls) : Math.max(...rolls))
      : null;
    const diceTotal = selectedRoll ?? rolls.reduce((a, b) => a + b, 0);
    const total = diceTotal + modifier;
    const entry = {
      id: id(),
      mode: "standard",
      modeLabel: "Standard",
      formula: formulaText,
      rolls,
      rollDetails,
      selectedRoll,
      droppedRoll,
      die: rollDetails.length === 1 ? rollDetails[0].die : null,
      qty: rolls.length,
      modifier,
      total,
      dc: null,
      isSuccess: null,
      isCritical: rollDetails.some((group) => group.die === 20 && group.rolls.includes(20)),
      isFumble: !rollDetails.some((group) => group.die === 20 && group.rolls.includes(20)) && rollDetails.some((group) => group.die === 20 && group.rolls.includes(1)),
      timestamp: nowLabel(),
    };
    setStandard((previous) => ({ ...previous, ...cfg, qty: groups[0].qty, die: groups[0].die, modifier }));
    completeRoll(entry);
  }

  function rollFate(override = {}) {
    const cfg = { ...fate, ...override };
    const q = clampInt(cfg.fateQty ?? cfg.qty, 1, 20);
    const modifier = clampInt(cfg.fateMod ?? cfg.modifier, -20, 20);
    const numericRolls = Array.from({ length: q }, rollFateDie);
    const diceTotal = numericRolls.reduce((a, b) => a + b, 0);
    const total = diceTotal + modifier;
    const entry = {
      id: id(),
      mode: "fate",
      modeLabel: "Fate / Fudge",
      formula: fateFormula(q, modifier),
      fateRolls: numericRolls.map(fateSymbol),
      numericRolls,
      diceTotal,
      modifier,
      total,
      ladderLabel: FATE_LADDER[total] || (total > 8 ? "Ponad legendarny" : "Ponizej fatalnego"),
      dc: null,
      isSuccess: null,
      timestamp: nowLabel(),
    };
    setFate({ qty: q, modifier });
    completeRoll(entry);
  }

  function rollGenesys(override = {}) {
    const pool = { ...genesysPool, ...override };
    const dicePool = Object.fromEntries(Object.entries(GENESYS_LABELS).map(([key]) => [key, clampInt(pool[key] || 0, 0, 20)]));
    const rawSymbols = emptySymbols();
    Object.entries(dicePool).forEach(([dieKey, count]) => {
      const sides = GENESYS_DICE[dieKey] || [];
      for (let i = 0; i < count; i += 1) {
        addSymbols(rawSymbols, sides[Math.floor(Math.random() * sides.length)]);
      }
    });
    const successTotal = rawSymbols.success + rawSymbols.triumph;
    const failureTotal = rawSymbols.failure + rawSymbols.despair;
    const advantageTotal = rawSymbols.advantage;
    const threatTotal = rawSymbols.threat;
    const entry = {
      id: id(),
      mode: "genesys",
      modeLabel: "Genesys / Narrative",
      dicePool,
      rawSymbols,
      netSuccess: Math.max(0, successTotal - failureTotal),
      netFailure: Math.max(0, failureTotal - successTotal),
      netAdvantage: Math.max(0, advantageTotal - threatTotal),
      netThreat: Math.max(0, threatTotal - advantageTotal),
      triumph: rawSymbols.triumph,
      despair: rawSymbols.despair,
      timestamp: nowLabel(),
    };
    entry.interpretation = interpretGenesys(entry);
    setGenesysPool(dicePool);
    completeRoll(entry);
  }

  function rollCurrent() {
    if (mode === "fate") return rollFate();
    if (mode === "genesys") return rollGenesys();
    return rollStandard();
  }

  function resetRoll() {
    setLastRoll(null);
  }

  const currentFormula = useMemo(() => {
    if (mode === "fate") return fateFormula(fate.qty, fate.modifier);
    if (mode === "genesys") return Object.entries(genesysPool).filter(([, count]) => count > 0).map(([key, count]) => `${count} ${GENESYS_LABELS[key]}`).join(" + ") || "Pula narracyjna";
    return standard.rollType === "advantage" || standard.rollType === "disadvantage"
      ? `${formatStandardFormula([{ qty: 2, die: standard.die }], standard.modifier)} ${rollTypeLabel(standard.rollType)}`
      : formatStandardFormula([{ qty: standard.qty, die: standard.die }], standard.modifier);
  }, [fate, genesysPool, mode, standard]);

  return (
    <div className="page dicePage">
      <div className="pageHeader dicePageHeader">
        <div>
          <span className="pageEyebrow">narzędzia</span>
          <h1 className="pageTitle dicePageTitle">Kości</h1>
          <p className="pageSubtitle">Uniwersalny roller: klasyczne kosci, Fate/Fudge i Genesys/Narrative.</p>
        </div>
      </div>

      <div className="diceWorkbench diceTabPanel">
          <section className="diceCard diceArena">
            <div className="diceArenaTop">
              <div className="diceArenaFormula">{currentFormula}</div>
              <button type="button" className="diceGhostBtn" onClick={resetRoll}>Wyczyść</button>
            </div>

            <div className="diceArenaModTag">
              Tryb <strong>{modeLabel(mode)}</strong>
            </div>

            <div className="diceVisualZone">
              {lastRoll ? (
                <div className="diceVisualDiceRow">
                  {lastRoll.mode === "genesys" ? (
                    <div className="diceNarrativeResult">
                      <div className="diceGenesysSymbols">
                        {genesysSymbolItems(lastRoll).length ? genesysSymbolItems(lastRoll).map((item) => (
                          <span key={item.key} className={`diceGenesysSymbol is-${item.key}`}>
                            <strong>{item.mark}</strong>
                            <em>x{item.value}</em>
                          </span>
                        )) : <span className="diceGenesysNeutral">Brak symboli</span>}
                      </div>
                      <div className="diceGenesysNet">
                        {genesysNetItems(lastRoll).length ? genesysNetItems(lastRoll).map((item) => (
                          <span key={item.key}>{item.label}: <strong>{item.value}</strong></span>
                        )) : <span>Wynik neutralny</span>}
                      </div>
                    </div>
                  ) : lastRoll.mode === "fate" ? (
                    lastRoll.fateRolls.map((value, index) => <div key={index} className="diceArenaDie"><strong className="diceArenaDieTxt">{value}</strong><span className="diceArenaDieType">Fate</span></div>)
                  ) : (
                    (lastRoll.rollDetails?.flatMap((group) => group.rolls.map((value) => ({ value, die: group.die }))) || lastRoll.rolls.map((value) => ({ value, die: lastRoll.die })))
                      .slice(0, 12)
                      .map((item, index) => <div key={index} className="diceArenaDie"><strong className="diceArenaDieTxt">{item.value}</strong><span className="diceArenaDieType">k{item.die}</span></div>)
                  )}
                </div>
              ) : (
                <div className="diceVisualEmpty">
                  <span>Brak rzutu. Ustaw tryb i kliknij "Rzuć".</span>
                </div>
              )}
            </div>

            <div className="diceFinalWrap">
              <div className="diceFinalLabel">WYNIK</div>
              <div className="diceFinalValue">{lastRoll ? historyTotal(lastRoll) : "—"}</div>
              {lastRoll?.ladderLabel && <div className="diceFinalHint is-success">{lastRoll.ladderLabel}</div>}
              {lastRoll?.isCritical && <div className="diceFinalHint is-critical">Naturalne 20</div>}
              {lastRoll?.isFumble && <div className="diceFinalHint is-fail">Naturalne 1</div>}
              {lastRoll?.mode === "genesys" && <div className="diceFinalHint is-success">{lastRoll.interpretation}</div>}
            </div>

            <div className="diceMainActions">
              <button type="button" className="dicePrimaryBtn" onClick={rollCurrent}>Rzuć</button>
            </div>
          </section>

          <section className="diceCard diceConfig">
            <div className="diceColumnHeader">
              <span className="diceColumnTitle">Konfiguracja</span>
            </div>

            <div className="diceConfigField">
              <label className="diceConfigLabel">Tryb kości</label>
              <select className="diceSelect" value={mode} onChange={(event) => setMode(event.target.value)}>
                {MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            {mode === "standard" && (
              <>
                <div className="diceConfigField">
                  <label className="diceConfigLabel">Kosc</label>
                  <select className="diceSelect" value={standard.die} onChange={(event) => setStandard((cfg) => ({ ...cfg, die: clampInt(event.target.value, 2, 10000) }))}>
                    {STANDARD_DICE.map((sides) => <option key={sides} value={sides}>k{sides}</option>)}
                  </select>
                </div>
                <NumberStepper label="Ilosc rzutow" value={standard.qty} min={1} max={100} onChange={(value) => setStandard((cfg) => ({ ...cfg, qty: value }))} />
                <NumberStepper label="Modyfikator" value={standard.modifier} min={-9999} max={9999} onChange={(value) => setStandard((cfg) => ({ ...cfg, modifier: value }))} />
                <div className="diceConfigField">
                  <label className="diceConfigLabel">Typ rzutu</label>
                  <select className="diceSelect" value={standard.rollType} onChange={(event) => setStandard((cfg) => ({ ...cfg, rollType: event.target.value }))}>
                    {ROLL_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {mode === "fate" && (
              <>
                <NumberStepper label="Liczba kości Fate" value={fate.qty} min={1} max={20} onChange={(value) => setFate((cfg) => ({ ...cfg, qty: value }))} />
                <NumberStepper label="Modyfikator / umiejętność" value={fate.modifier} min={-20} max={20} onChange={(value) => setFate((cfg) => ({ ...cfg, modifier: value }))} />
              </>
            )}

            {mode === "genesys" && (
              <div className="diceGenesysPool">
                {Object.entries(GENESYS_LABELS).map(([key, label]) => (
                  <GenesysDieControl key={key} dieKey={key} label={label} value={genesysPool[key]} min={0} max={20} onChange={(value) => setGenesysPool((pool) => ({ ...pool, [key]: value }))} />
                ))}
              </div>
            )}

          </section>

      </div>
    </div>
  );
}

function NumberStepper({ label, value, min, max, onChange }) {
  return (
    <div className="diceConfigRow">
      <span className="diceConfigLabel">{label}</span>
      <div className="diceQtyControl">
        <button type="button" className="diceQtyStep" onClick={() => onChange(clampInt(value - 1, min, max))} disabled={value <= min}>-</button>
        <input className="diceQtyNum diceQtyInput" type="number" value={value} min={min} max={max} onChange={(event) => onChange(clampInt(event.target.value, min, max))} />
        <button type="button" className="diceQtyStep" onClick={() => onChange(clampInt(value + 1, min, max))} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function GenesysDieControl({ dieKey, label, value, min, max, onChange }) {
  const meta = GENESYS_DIE_META[dieKey] || { mark: label.slice(0, 1), tone: "neutral" };
  return (
    <div className={`diceGenesysDie is-${meta.tone}`}>
      <div className="diceGenesysDieHead">
        <span className="diceGenesysDieMark">{meta.mark}</span>
        <span className="diceGenesysDieLabel">{label}</span>
      </div>
      <div className="diceQtyControl diceQtyControl--compact">
        <button type="button" className="diceQtyStep" onClick={() => onChange(clampInt(value - 1, min, max))} disabled={value <= min}>-</button>
        <input className="diceQtyNum diceQtyInput" type="number" value={value} min={min} max={max} onChange={(event) => onChange(clampInt(event.target.value, min, max))} />
        <button type="button" className="diceQtyStep" onClick={() => onChange(clampInt(value + 1, min, max))} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function HistoryPanel({ history, filter, setFilter, onClear, compact = false }) {
  return (
    <section className="diceCard diceHistoryCard">
      <div className="diceHistoryHeader">
        <h3 className="diceHistoryTitle">Historia rzutów</h3>
        <select className="diceSelect diceSelect--sm" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Wszystkie</option>
          {MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className="diceHistoryList">
        {history.length === 0 && <div className="diceHistoryEmpty">Brak historii.</div>}
        {history.map((entry) => (
          <article key={entry.id} className="diceHistoryItem">
            <div className="diceHistoryTop">
              <strong className="diceHistoryFormula">{historyTitle(entry)}</strong>
              <span className="diceHistoryTotal">{historyTotal(entry)}</span>
            </div>
            <div className="diceHistoryMeta">{entry.modeLabel || modeLabel(entry.mode)} | {entry.timestamp}</div>
            <div className="diceHistoryBreakdown">{historyBreakdown(entry)}</div>
            {entry.isCritical && <span className="diceHistoryBadge is-critical">Krytyk</span>}
            {entry.isFumble && <span className="diceHistoryBadge is-fail">Fumble</span>}
            {entry.isSuccess === true && <span className="diceHistoryBadge is-success">Sukces</span>}
            {entry.isSuccess === false && <span className="diceHistoryBadge is-fail">Porażka</span>}
          </article>
        ))}
      </div>
      {!compact && onClear && <button type="button" className="diceSecondaryBtn" onClick={onClear}>Wyczyść historię</button>}
    </section>
  );
}

function StatsPanel({ stats, distribution }) {
  return (
    <div className="diceBottomGrid">
      <section className="diceCard diceStatsCard">
        <div className="diceStatsHeader"><h3 className="diceHistoryTitle">Statystyki numeryczne</h3></div>
        <div className="diceMetrics">
          {[
            ["RZUTY", stats.count],
            ["ŚREDNIA", stats.average !== null ? stats.average.toFixed(2) : "—"],
            ["MIN", stats.min ?? "—"],
            ["MAX", stats.max ?? "—"],
            ["SUKCESY", stats.successes],
            ["PORAŻKI", stats.failures],
            ["KRYTYKI", stats.criticals],
            ["FUMBLE", stats.fumbles],
          ].map(([label, value]) => (
            <article key={label} className="diceMetricBox"><span className="diceMetricLabel">{label}</span><strong className="diceMetricValue">{value}</strong></article>
          ))}
        </div>
      </section>
      <section className="diceCard diceStatsCard">
        <div className="diceStatsHeader"><h3 className="diceHistoryTitle">Genesys / Narrative</h3></div>
        <div className="diceMetrics">
          {[
            ["RZUTY", stats.genesysCount],
            ["UDANE AKCJE", stats.successfulActions],
            ["NIEUDANE AKCJE", stats.failedActions],
            ["TRIUMPH", stats.totalTriumph],
            ["DESPAIR", stats.totalDespair],
            ["NET SUCCESS", stats.totalNetSuccess],
            ["NET FAILURE", stats.totalNetFailure],
            ["NET ADV/THREAT", `${stats.totalNetAdvantage}/${stats.totalNetThreat}`],
          ].map(([label, value]) => (
            <article key={label} className="diceMetricBox"><span className="diceMetricLabel">{label}</span><strong className="diceMetricValue">{value}</strong></article>
          ))}
        </div>
      </section>
      <section className="diceCard diceChartCard">
        <div className="diceStatsHeader"><h3 className="diceHistoryTitle">Rozkład wyników</h3></div>
        <div className="diceBarChart">
          {distribution.rows.length === 0 ? <div className="diceHistoryEmpty">Wykonaj rzuty numeryczne, aby zobaczyć rozkład.</div> : (
            <div className="diceBarChartInner">
              {distribution.rows.map(([value, count]) => (
                <div key={value} className="diceBarCol">
                  <span className="diceBarCount">{count}</span>
                  <div className="diceBarTrack"><div className="diceBarFill" style={{ height: `${(count / distribution.peak) * 100}%` }} /></div>
                  <span className="diceBarLabel">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
