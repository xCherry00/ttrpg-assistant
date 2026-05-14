import { useEffect, useMemo, useState } from "react";
import "../styles/dice.css";

const HISTORY_KEY = "ttrpg:dice-history:v3";
const MODES = [
  { value: "standard", label: "Standard" },
  { value: "fate", label: "Fate / Fudge" },
  { value: "genesys", label: "Genesys / Narrative" },
  { value: "custom", label: "Custom" },
];

const TABS = [
  { id: "roll", label: "Roll" },
  { id: "history", label: "History" },
  { id: "stats", label: "Stats" },
];

const STANDARD_DICE = [4, 6, 8, 10, 12, 20, 100];
const ROLL_TYPES = [
  { value: "normal", label: "Zwykły" },
  { value: "advantage", label: "Advantage" },
  { value: "disadvantage", label: "Disadvantage" },
];

const FATE_LADDER = {
  "-2": "Terrible",
  "-1": "Poor",
  0: "Mediocre",
  1: "Average",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Superb",
  6: "Fantastic",
  7: "Epic",
  8: "Legendary",
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

function formula(qty, die, modifier) {
  const mod = Number(modifier) || 0;
  if (mod === 0) return `${qty}d${die}`;
  return `${qty}d${die}${mod > 0 ? "+" : ""}${mod}`;
}

function fateFormula(qty, modifier) {
  const mod = Number(modifier) || 0;
  if (mod === 0) return `${qty}dF`;
  return `${qty}dF${mod > 0 ? "+" : ""}${mod}`;
}

function modeLabel(mode) {
  return MODES.find((item) => item.value === mode)?.label || mode;
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

function parseHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function standardBreakdown(entry) {
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

function statsFor(history) {
  const numeric = history.filter((entry) => ["standard", "custom", "fate"].includes(entry.mode) && Number.isFinite(entry.total));
  const genesys = history.filter((entry) => entry.mode === "genesys");
  const totals = numeric.map((entry) => entry.total);
  return {
    count: history.length,
    numericCount: numeric.length,
    average: totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null,
    min: totals.length ? Math.min(...totals) : null,
    max: totals.length ? Math.max(...totals) : null,
    successes: numeric.filter((entry) => entry.isSuccess === true).length,
    failures: numeric.filter((entry) => entry.isSuccess === false).length,
    criticals: numeric.filter((entry) => entry.isCritical).length,
    fumbles: numeric.filter((entry) => entry.isFumble).length,
    genesysCount: genesys.length,
    successfulActions: genesys.filter((entry) => entry.netSuccess > 0).length,
    failedActions: genesys.filter((entry) => entry.netFailure > 0).length,
    totalTriumph: genesys.reduce((sum, entry) => sum + entry.triumph, 0),
    totalDespair: genesys.reduce((sum, entry) => sum + entry.despair, 0),
    totalNetSuccess: genesys.reduce((sum, entry) => sum + entry.netSuccess, 0),
    totalNetFailure: genesys.reduce((sum, entry) => sum + entry.netFailure, 0),
    totalNetAdvantage: genesys.reduce((sum, entry) => sum + entry.netAdvantage, 0),
    totalNetThreat: genesys.reduce((sum, entry) => sum + entry.netThreat, 0),
  };
}

export default function DicePage() {
  const historyLimit = 50;
  const [mode, setMode] = useState("standard");
  const [activeTab, setActiveTab] = useState("roll");
  const [dc, setDc] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [lastRoll, setLastRoll] = useState(null);
  const [history, setHistory] = useState(() => parseHistory().slice(0, historyLimit));

  const [standard, setStandard] = useState({ qty: 1, die: 20, modifier: 0, rollType: "normal" });
  const [fate, setFate] = useState({ qty: 4, modifier: 0 });
  const [custom, setCustom] = useState({ qty: 1, die: 20, modifier: 0 });
  const [genesysPool, setGenesysPool] = useState({ ability: 1, proficiency: 0, boost: 0, difficulty: 1, challenge: 0, setback: 0 });

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, historyLimit))); } catch {}
  }, [history]);

  function addHistoryEntry(entry) {
    setHistory((previous) => [entry, ...previous.filter((item) => item.id !== entry.id)].slice(0, historyLimit));
  }

  function completeRoll(entry) {
    setLastRoll(entry);
    addHistoryEntry(entry);
  }

  function rollStandard(override = {}) {
    const cfg = { ...standard, ...override };
    const q = clampInt(cfg.qty, 1, 100);
    const d = clampInt(cfg.die, 2, 1000);
    const modifier = clampInt(cfg.modifier, -9999, 9999);
    const rollType = cfg.rollType || "normal";
    const isAdvantage = rollType === "advantage" || rollType === "disadvantage";
    const rolls = isAdvantage ? [rollDie(20), rollDie(20)] : Array.from({ length: q }, () => rollDie(d));
    const selectedRoll = isAdvantage ? (rollType === "advantage" ? Math.max(...rolls) : Math.min(...rolls)) : null;
    const droppedRoll = isAdvantage ? (rollType === "advantage" ? Math.min(...rolls) : Math.max(...rolls)) : null;
    const diceTotal = selectedRoll ?? rolls.reduce((a, b) => a + b, 0);
    const total = diceTotal + modifier;
    const dcValue = dc !== "" ? Number(dc) : null;
    const entry = {
      id: id(),
      mode: "standard",
      modeLabel: "Standard",
      formula: isAdvantage ? `2d20 ${rollType}` : formula(q, d, modifier),
      rolls,
      selectedRoll,
      droppedRoll,
      die: isAdvantage ? 20 : d,
      qty: isAdvantage ? 2 : q,
      modifier,
      total,
      dc: dcValue,
      isSuccess: dcValue !== null && Number.isFinite(dcValue) ? total >= dcValue : null,
      isCritical: (isAdvantage ? selectedRoll : rolls[0]) === 20 && (isAdvantage || d === 20),
      isFumble: (isAdvantage ? selectedRoll : rolls[0]) === 1 && (isAdvantage || d === 20),
      timestamp: nowLabel(),
    };
    setStandard(cfg);
    completeRoll(entry);
  }

  function rollCustom(override = {}) {
    const cfg = { ...custom, ...override };
    const q = clampInt(cfg.qty, 1, 100);
    const d = clampInt(cfg.die, 2, 10000);
    const modifier = clampInt(cfg.modifier, -9999, 9999);
    const rolls = Array.from({ length: q }, () => rollDie(d));
    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    const dcValue = dc !== "" ? Number(dc) : null;
    const entry = {
      id: id(),
      mode: "custom",
      modeLabel: "Custom",
      formula: formula(q, d, modifier),
      rolls,
      die: d,
      qty: q,
      modifier,
      total,
      dc: dcValue,
      isSuccess: dcValue !== null && Number.isFinite(dcValue) ? total >= dcValue : null,
      isCritical: false,
      isFumble: false,
      timestamp: nowLabel(),
    };
    setCustom(cfg);
    completeRoll(entry);
  }

  function rollFate(override = {}) {
    const cfg = { ...fate, ...override };
    const q = clampInt(cfg.fateQty ?? cfg.qty, 1, 20);
    const modifier = clampInt(cfg.fateMod ?? cfg.modifier, -20, 20);
    const numericRolls = Array.from({ length: q }, rollFateDie);
    const diceTotal = numericRolls.reduce((a, b) => a + b, 0);
    const total = diceTotal + modifier;
    const dcValue = dc !== "" ? Number(dc) : null;
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
      ladderLabel: FATE_LADDER[total] || (total > 8 ? "Beyond Legendary" : "Below Terrible"),
      dc: dcValue,
      isSuccess: dcValue !== null && Number.isFinite(dcValue) ? total >= dcValue : null,
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
    if (mode === "custom") return rollCustom();
    return rollStandard();
  }

  function resetRoll() {
    setLastRoll(null);
    setDc("");
  }

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return history;
    return history.filter((entry) => entry.mode === historyFilter);
  }, [history, historyFilter]);

  const stats = useMemo(() => statsFor(history), [history]);

  const distribution = useMemo(() => {
    const rows = new Map();
    history.filter((entry) => ["standard", "custom", "fate"].includes(entry.mode)).forEach((entry) => {
      rows.set(entry.total, (rows.get(entry.total) || 0) + 1);
    });
    const sorted = [...rows.entries()].sort((a, b) => a[0] - b[0]);
    return { rows: sorted, peak: sorted.length ? Math.max(...sorted.map(([, count]) => count)) : 1 };
  }, [history]);

  const currentFormula = useMemo(() => {
    if (mode === "fate") return fateFormula(fate.qty, fate.modifier);
    if (mode === "genesys") return Object.entries(genesysPool).filter(([, count]) => count > 0).map(([key, count]) => `${count} ${GENESYS_LABELS[key]}`).join(" + ") || "Pula narracyjna";
    if (mode === "custom") return formula(custom.qty, custom.die, custom.modifier);
    return standard.rollType === "advantage" || standard.rollType === "disadvantage" ? `2d20 ${standard.rollType}` : formula(standard.qty, standard.die, standard.modifier);
  }, [custom, fate, genesysPool, mode, standard]);

  return (
    <div className="page dicePage">
      <div className="pageHeader dicePageHeader">
        <div>
          <span className="pageEyebrow">narzędzia</span>
          <h1 className="pageTitle dicePageTitle">Kości</h1>
          <p className="pageSubtitle">Uniwersalny roller: klasyczne kości, Fate/Fudge, Genesys/Narrative i tryb custom.</p>
        </div>
        <div className="dicePageControlRow">
          <nav className="diceTabs" role="tablist">
            {TABS.map((tab) => (
              <button key={tab.id} role="tab" type="button" aria-selected={activeTab === tab.id} className={`diceTab${activeTab === tab.id ? " is-active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === "roll" && (
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
                      <strong>{historyTotal(lastRoll)}</strong>
                      <span>{lastRoll.interpretation}</span>
                    </div>
                  ) : lastRoll.mode === "fate" ? (
                    lastRoll.fateRolls.map((value, index) => <div key={index} className="diceArenaDie"><strong className="diceArenaDieTxt">{value}</strong><span className="diceArenaDieType">Fate</span></div>)
                  ) : (
                    lastRoll.rolls.slice(0, 8).map((value, index) => <div key={index} className="diceArenaDie"><strong className="diceArenaDieTxt">{value}</strong><span className="diceArenaDieType">d{lastRoll.die}</span></div>)
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
              {lastRoll?.isSuccess === true && <div className="diceFinalHint is-success">Sukces{lastRoll.dc !== null ? ` (DC ${lastRoll.dc})` : ""}</div>}
              {lastRoll?.isSuccess === false && <div className="diceFinalHint is-fail">Porażka{lastRoll.dc !== null ? ` (DC ${lastRoll.dc})` : ""}</div>}
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
                <div className="diceDieChipGrid">
                  {STANDARD_DICE.map((sides) => (
                    <button key={sides} type="button" className={`diceDieChip${standard.die === sides ? " is-active" : ""}`} onClick={() => setStandard((cfg) => ({ ...cfg, die: sides }))}>
                      <span className="diceDieChipLabel">d{sides}</span>
                    </button>
                  ))}
                </div>
                <NumberStepper label="Liczba kości" value={standard.qty} min={1} max={100} onChange={(value) => setStandard((cfg) => ({ ...cfg, qty: value }))} />
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
                  <NumberStepper key={key} label={label} value={genesysPool[key]} min={0} max={20} onChange={(value) => setGenesysPool((pool) => ({ ...pool, [key]: value }))} />
                ))}
              </div>
            )}

            {mode === "custom" && (
              <>
                <NumberStepper label="Liczba kości" value={custom.qty} min={1} max={100} onChange={(value) => setCustom((cfg) => ({ ...cfg, qty: value }))} />
                <NumberStepper label="Liczba ścian" value={custom.die} min={2} max={10000} onChange={(value) => setCustom((cfg) => ({ ...cfg, die: value }))} />
                <NumberStepper label="Modyfikator" value={custom.modifier} min={-9999} max={9999} onChange={(value) => setCustom((cfg) => ({ ...cfg, modifier: value }))} />
              </>
            )}

            {mode !== "genesys" && (
              <div className="diceConfigField">
                <label className="diceConfigLabel">DC / próg <span className="diceOptional">(opcjonalne)</span></label>
                <input className="diceInput" type="number" value={dc} onChange={(event) => setDc(event.target.value)} placeholder="np. 15" />
              </div>
            )}

          </section>

          <HistoryPanel history={filteredHistory.slice(0, 8)} filter={historyFilter} setFilter={setHistoryFilter} compact />
        </div>
      )}

      {activeTab === "history" && (
        <div className="diceTabPanel">
          <HistoryPanel history={filteredHistory} filter={historyFilter} setFilter={setHistoryFilter} onClear={() => setHistory([])} />
        </div>
      )}

      {activeTab === "stats" && (
        <div className="diceTabPanel">
          <StatsPanel stats={stats} distribution={distribution} />
        </div>
      )}
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
