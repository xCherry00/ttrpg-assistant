import { useId, useEffect, useMemo, useState } from "react";
import "../styles/dice.css";

const DICE_TYPES = [4, 6, 8, 10, 12, 20];
const HISTORY_MAX = 20;
const PRESETS_MAX = 12;
const PRESETS_KEY = "ttrpg:dice-presets:v2";

const QUICK_ROLLS = [
  { qty: 1, die: 20, label: "1d20" },
  { qty: 2, die: 20, label: "2d20" },
  { qty: 1, die: 100, label: "1d100" },
  { qty: 2, die: 6, label: "2d6" },
  { qty: 3, die: 6, label: "3d6" },
  { qty: 4, die: 8, label: "4d8" },
  { qty: 1, die: 12, label: "1d12" },
  { qty: 1, die: 4, label: "1d4" },
];

const ROLL_TYPES = [
  { value: "public", label: "Publiczny rzut" },
  { value: "hidden", label: "Ukryty rzut" },
  { value: "advantage", label: "Przewaga" },
  { value: "disadvantage", label: "Utrudnienie" },
];

const TABS = [
  { id: "roll", label: "Rzut kościmi" },
  { id: "history", label: "Historia" },
  { id: "stats", label: "Statystyki" },
  { id: "settings", label: "Ustawienia" },
];

const DIE_PATHS = {
  4: "M50 8 L92 88 L8 88 Z",
  8: "M50 8 L92 50 L50 92 L8 50 Z",
  10: "M50 8 L90 38 L76 88 L24 88 L10 38 Z",
  12: "M50 8 L85 26 L85 74 L50 92 L15 74 L15 26 Z",
  20: "M50 4 L91 27 L91 73 L50 96 L9 73 L9 27 Z",
};

function DieFaceSmall({ sides }) {
  return (
    <svg viewBox="0 0 100 100" className="diceDieChipSvg" aria-hidden="true">
      {sides === 6 ? (
        <rect x="10" y="10" width="80" height="80" rx="12" />
      ) : sides === 100 ? (
        <circle cx="50" cy="50" r="44" />
      ) : (
        <path d={DIE_PATHS[sides] ?? DIE_PATHS[20]} />
      )}
    </svg>
  );
}

function DieFaceLarge({ sides, value }) {
  const uid = useId();
  const gradId = `dg${uid.replace(/:/g, "")}`;
  return (
    <div className="diceArenaDie">
      <svg viewBox="0 0 100 100" className="diceArenaDieSvg" aria-hidden="true">
        <defs>
          <radialGradient id={gradId} cx="35%" cy="25%" r="78%">
            <stop offset="0%" stopColor="rgba(150,86,255,0.38)" />
            <stop offset="100%" stopColor="rgba(4,7,18,0.95)" />
          </radialGradient>
        </defs>
        {sides === 6 ? (
          <rect x="8" y="8" width="84" height="84" rx="10" fill={`url(#${gradId})`} className="diceArenaDiePath" />
        ) : sides === 100 ? (
          <circle cx="50" cy="50" r="44" fill={`url(#${gradId})`} className="diceArenaDiePath" />
        ) : (
          <path d={DIE_PATHS[sides] ?? DIE_PATHS[20]} fill={`url(#${gradId})`} className="diceArenaDiePath" />
        )}
        <text x="50" y="57" textAnchor="middle" dominantBaseline="middle" className="diceArenaDieTxt">
          {value}
        </text>
      </svg>
      <span className="diceArenaDieType">d{sides}</span>
    </div>
  );
}

function clampInt(v, min, max) {
  const n = Math.trunc(Number(v));
  return Number.isNaN(n) ? min : Math.max(min, Math.min(max, n));
}

function buildFormula(qty, die, mod) {
  const m = Number(mod) || 0;
  if (m === 0) return `${qty}d${die}`;
  return `${qty}d${die} ${m > 0 ? "+" : "-"} ${Math.abs(m)}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export default function DicePage() {
  const [die, setDie] = useState(20);
  const [qty, setQty] = useState(1);
  const [mod, setMod] = useState(0);
  const [dc, setDc] = useState("");
  const [note, setNote] = useState("");
  const [rollType, setRollType] = useState("public");
  const [autoAdd, setAutoAdd] = useState(false);
  const [hiddenFromGM, setHiddenFromGM] = useState(false);
  const [activeTab, setActiveTab] = useState("roll");
  const [lastRoll, setLastRoll] = useState(null);
  const [history, setHistory] = useState([]);
  const [presets, setPresets] = useState([]);

  const formula = useMemo(() => buildFormula(qty, die, mod), [qty, die, mod]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setPresets(parsed.slice(0, PRESETS_MAX));
    } catch { setPresets([]); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presets)); } catch {}
  }, [presets]);

  function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function doRoll(oQty = qty, oDie = die, oMod = mod) {
    const m = Number(oMod) || 0;
    const q = clampInt(oQty, 1, 50);
    const d = clampInt(oDie, 2, 1000);
    const rolls = Array.from({ length: q }, () => rollDie(d));
    const total = rolls.reduce((a, b) => a + b, 0) + m;
    const isCritical = d === 20 && rolls.some((r) => r === 20);
    const dcNum = dc !== "" ? Number(dc) : null;
    const isSuccess = dcNum !== null ? total >= dcNum : null;
    const entry = {
      id: crypto.randomUUID(),
      formula: buildFormula(q, d, m),
      rolls, die: d, qty: q, mod: m,
      total, isCritical, isSuccess, dcNum,
      note, rollType,
      createdAt: nowLabel(),
    };
    setLastRoll(entry);
    if (autoAdd) pushHistory(entry);
  }

  function pushHistory(entry) {
    setHistory((prev) => {
      if (prev[0]?.id === entry.id) return prev;
      return [entry, ...prev].slice(0, HISTORY_MAX);
    });
  }

  function addToHistory() {
    if (lastRoll) pushHistory(lastRoll);
  }

  function runQuickRoll(q, d) {
    setQty(q); setDie(d);
    doRoll(q, d, mod);
  }

  function savePreset() {
    const label = formula;
    if (presets.some((p) => p.label === label)) return;
    setPresets((prev) => [{ id: crypto.randomUUID(), label, qty, die, mod: Number(mod) || 0 }, ...prev].slice(0, PRESETS_MAX));
  }

  function removePreset(id) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }

  function usePreset(preset) {
    setQty(preset.qty); setDie(preset.die); setMod(preset.mod);
    doRoll(preset.qty, preset.die, preset.mod);
  }

  function reset() {
    setQty(1); setDie(20); setMod(0); setDc(""); setNote(""); setLastRoll(null);
  }

  const dcNum = dc !== "" ? Number(dc) : null;
  const isSuccess = lastRoll && dcNum !== null ? lastRoll.total >= dcNum : null;

  const stats = useMemo(() => {
    if (!history.length) return { avg: 0, max: 0, min: 0, successRate: 0, failRate: 0 };
    const totals = history.map((h) => h.total);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const successCount = totals.filter((t) => t >= 15).length;
    const sr = Math.round((successCount / totals.length) * 100);
    return { avg, max: Math.max(...totals), min: Math.min(...totals), successRate: sr, failRate: 100 - sr };
  }, [history]);

  const distribution = useMemo(() => {
    const counts = new Map();
    history.forEach((h) => counts.set(h.total, (counts.get(h.total) || 0) + 1));
    const rows = [...counts.entries()].sort((a, b) => a[0] - b[0]);
    const peak = rows.length ? Math.max(...rows.map(([, c]) => c)) : 1;
    return { rows, peak };
  }, [history]);

  return (
    <div className="page dicePage">
      {/* ── Header ── */}
      <div className="pageHeader dicePageHeader">
        <div>
          <span className="pageEyebrow">narzedzia</span>
          <h1 className="pageTitle dicePageTitle">Kostkarka</h1>
          <p className="pageSubtitle">Ustaw rzut, zapisz zestawy i kontroluj historie wynikow.</p>
        </div>
        <div className="dicePageControlRow">
          <nav className="diceTabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id} role="tab" type="button"
                aria-selected={activeTab === t.id}
                className={`diceTab${activeTab === t.id ? " is-active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >{t.label}</button>
            ))}
          </nav>
          <div className="diceHeaderTools">
            <label className="diceMgToggleWrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Ukryty rzut MG</span>
              <button
                role="switch" type="button" aria-checked={hiddenFromGM}
                className={`diceToggleSwitch${hiddenFromGM ? " is-on" : ""}`}
                onClick={() => setHiddenFromGM((v) => !v)}
              ><span className="diceToggleThumb" /></button>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </label>
            <button type="button" className="diceManageBtn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Zarządzaj kościmi
            </button>
          </div>
        </div>
      </div>

      {/* ── 3-col Workbench ── */}
      <div className="diceWorkbench">

        {/* LEFT: Arena */}
        <section className="diceCard diceArena">
          <div className="diceArenaTop">
            <div className="diceArenaFormula">{formula}</div>
            <button type="button" className="diceGhostBtn" onClick={reset}>Wyczyść</button>
          </div>

          {Number(mod) !== 0 && (
            <div className="diceArenaModTag">
              Modyfikator <strong>{Number(mod) > 0 ? `+${mod}` : mod}</strong>
            </div>
          )}

          <div className="diceVisualZone">
            {lastRoll ? (
              <div className="diceVisualDiceRow">
                {lastRoll.rolls.slice(0, 4).map((v, i) => (
                  <DieFaceLarge key={i} sides={lastRoll.die} value={v} />
                ))}
                {lastRoll.mod !== 0 && (
                  <div className="diceArenaModBadge">
                    <span className="diceArenaModVal">{lastRoll.mod > 0 ? `+${lastRoll.mod}` : lastRoll.mod}</span>
                    <span className="diceArenaModLbl">MODYFIKATOR</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="diceVisualEmpty">
                <svg viewBox="0 0 100 100" className="diceVisualPlaceholderSvg" aria-hidden="true">
                  <path d={DIE_PATHS[20]} />
                </svg>
                <span>Brak rzutu. Kliknij "Rzuć kościmi".</span>
              </div>
            )}
          </div>

          <div className="diceFinalWrap">
            <div className="diceFinalLabel">WYNIK KOŃCOWY</div>
            <div className="diceFinalValue">{lastRoll ? lastRoll.total : "—"}</div>
            {lastRoll?.isCritical && <div className="diceFinalHint is-critical">Krytyczny sukces!</div>}
            {lastRoll && !lastRoll.isCritical && isSuccess === true && (
              <div className="diceFinalHint is-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Sukces!{dcNum !== null ? ` (DC ${dcNum})` : ""}
              </div>
            )}
            {lastRoll && !lastRoll.isCritical && isSuccess === false && (
              <div className="diceFinalHint is-fail">Poniżej DC {dcNum}</div>
            )}
          </div>

          <div className="diceMainActions">
            <button type="button" className="dicePrimaryBtn" onClick={() => doRoll()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
              Rzuć kościmi
            </button>
            <button type="button" className="diceSecondaryBtn" onClick={addToHistory}>Dodaj do historii</button>
            <button type="button" className="diceIconBtn" onClick={savePreset} aria-label="Zapisz zestaw">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            </button>
          </div>

          <div className="diceQuickSection">
            <span className="diceQuickLabel">Szybkie rzuty</span>
            <div className="diceQuickRow">
              {QUICK_ROLLS.map((item) => (
                <button
                  key={item.label} type="button"
                  className={`diceQuickBtn${qty === item.qty && die === item.die ? " is-active" : ""}`}
                  onClick={() => runQuickRoll(item.qty, item.die)}
                >{item.label}</button>
              ))}
              <button type="button" className="diceQuickAddBtn" aria-label="Dodaj szybki rzut">+</button>
            </div>
          </div>
        </section>

        {/* MIDDLE: Kości config */}
        <section className="diceCard diceConfig">
          <div className="diceColumnHeader">
            <span className="diceColumnTitle">Kości</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="diceCollapseIcon" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          <div className="diceDieChipGrid">
            {DICE_TYPES.map((d) => (
              <button
                key={d} type="button"
                className={`diceDieChip${die === d ? " is-active" : ""}`}
                onClick={() => setDie(d)}
              >
                <DieFaceSmall sides={d} />
                <span className="diceDieChipLabel">d{d}</span>
              </button>
            ))}
          </div>

          <div className="diceConfigRow">
            <span className="diceConfigLabel">Liczba kości</span>
            <div className="diceQtyControl">
              <button type="button" className="diceQtyStep" onClick={() => setQty((q) => clampInt(q - 1, 1, 50))} disabled={qty <= 1}>—</button>
              <span className="diceQtyNum">{qty}</span>
              <button type="button" className="diceQtyStep" onClick={() => setQty((q) => clampInt(q + 1, 1, 50))} disabled={qty >= 50}>+</button>
            </div>
          </div>

          <div className="diceConfigRow">
            <span className="diceConfigLabel">Modyfikator</span>
            <div className="diceQtyControl">
              <button type="button" className="diceQtyStep" onClick={() => setMod((m) => clampInt(Number(m) - 1, -99, 999))}>—</button>
              <span className="diceQtyNum">{Number(mod) > 0 ? `+${mod}` : mod}</span>
              <button type="button" className="diceQtyStep" onClick={() => setMod((m) => clampInt(Number(m) + 1, -99, 999))}>+</button>
            </div>
          </div>

          <div className="diceConfigField">
            <label className="diceConfigLabel">Rodzaj rzutu</label>
            <select className="diceSelect" value={rollType} onChange={(e) => setRollType(e.target.value)}>
              {ROLL_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
            </select>
          </div>

          <div className="diceConfigField">
            <label className="diceConfigLabel">Trudność (DC) <span className="diceOptional">(opcjonalne)</span></label>
            <input type="number" className="diceInput" value={dc} onChange={(e) => setDc(e.target.value)} placeholder="np. 15" min="1" max="99" />
          </div>

          <div className="diceConfigField">
            <label className="diceConfigLabel">Notatka <span className="diceOptional">(opcjonalne)</span></label>
            <textarea className="diceTextarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Np. atak mieczem, test percepcji..." rows={2} />
          </div>

          <label className="diceCheckboxRow">
            <input type="checkbox" className="diceCheckbox" checked={autoAdd} onChange={(e) => setAutoAdd(e.target.checked)} />
            <span>Dodaj do historii</span>
          </label>
        </section>

        {/* RIGHT: Historia + Ulubione */}
        <section className="diceCard diceHistoryCard">
          <div className="diceHistoryHeader">
            <h3 className="diceHistoryTitle">Historia rzutów</h3>
            <select className="diceSelect diceSelect--sm">
              <option>Wszystkie</option>
              <option>Sukcesy</option>
              <option>Porażki</option>
            </select>
          </div>

          <div className="diceHistoryList">
            {history.length === 0 && (
              <div className="diceHistoryEmpty">Brak historii. Rzuć i kliknij "Dodaj do historii".</div>
            )}
            {history.map((item) => (
              <article key={item.id} className="diceHistoryItem">
                <div className="diceHistoryTop">
                  <strong className="diceHistoryFormula">{item.formula}</strong>
                  <span className="diceHistoryTotal">{item.total}</span>
                </div>
                <div className="diceHistoryMeta">Dzisiaj, {item.createdAt}</div>
                <div className="diceHistoryBreakdown">{item.rolls.join(" + ")}{item.mod !== 0 ? ` + ${item.mod}` : ""}</div>
                {item.isCritical && <span className="diceHistoryBadge is-critical">Krytyczny sukces</span>}
                {!item.isCritical && item.isSuccess === true && <span className="diceHistoryBadge is-success">Sukces</span>}
                {!item.isCritical && item.isSuccess === false && <span className="diceHistoryBadge is-fail">Porażka</span>}
              </article>
            ))}
          </div>

          {/* Ulubione zestawy */}
          <div className="dicePresetsSection">
            <div className="dicePresetsHeader">
              <span className="diceConfigLabel">Ulubione zestawy</span>
              <button type="button" className="diceLinkBtn">Zarządzaj</button>
            </div>
            <div className="dicePresetList">
              {presets.length === 0 && <div className="diceHistoryEmpty">Brak zestawów.</div>}
              {presets.map((p) => (
                <article key={p.id} className="dicePresetCard">
                  <button type="button" className="dicePresetUse" onClick={() => usePreset(p)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" strokeWidth="1" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span className="dicePresetLabel">{p.label}</span>
                  </button>
                  <button type="button" className="dicePresetDelete" onClick={() => removePreset(p.id)} aria-label="Usuń">×</button>
                </article>
              ))}
            </div>
            <button type="button" className="diceAddPresetBtn" onClick={savePreset}>
              + Dodaj nowy zestaw
            </button>
          </div>
        </section>
      </div>

      {/* ── Bottom: Stats + Chart ── */}
      <div className="diceBottomGrid">
        <section className="diceCard diceStatsCard">
          <div className="diceStatsHeader">
            <h3 className="diceHistoryTitle">Statystyki</h3>
            <span className="diceStatFormula">{formula} ▾</span>
          </div>
          <div className="diceMetrics">
            {[
              { label: "ŚREDNI WYNIK", value: history.length ? stats.avg.toFixed(2) : "—", cls: "" },
              { label: "NAJWYŻSZY WYNIK", value: history.length ? stats.max : "—", cls: "is-high" },
              { label: "NAJNIŻSZY WYNIK", value: history.length ? stats.min : "—", cls: "is-low" },
              { label: "LICZBA RZUTÓW", value: history.length, cls: "" },
            ].map((m) => (
              <article key={m.label} className={`diceMetricBox ${m.cls}`}>
                <span className="diceMetricLabel">{m.label}</span>
                <strong className="diceMetricValue">{m.value}</strong>
              </article>
            ))}
          </div>
          <div className="diceSuccessBars">
            {[
              { label: "Sukcesy", rate: stats.successRate, count: Math.round(history.length * stats.successRate / 100), cls: "is-success" },
              { label: "Porażki", rate: stats.failRate, count: Math.round(history.length * stats.failRate / 100), cls: "is-fail" },
            ].map((bar) => (
              <div key={bar.label} className="diceSuccessRow">
                <span className="diceSuccessLabel">{bar.label}</span>
                <div className="diceSuccessTrack">
                  <div className={`diceSuccessBar ${bar.cls}`} style={{ width: `${bar.rate}%` }} />
                </div>
                <span className="diceSuccessPct">{bar.rate}% ({bar.count})</span>
              </div>
            ))}
          </div>
        </section>

        <section className="diceCard diceChartCard">
          <div className="diceStatsHeader">
            <h3 className="diceHistoryTitle">Rozkład wyników ({formula})</h3>
          </div>
          <div className="diceBarChart">
            {distribution.rows.length === 0 ? (
              <div className="diceHistoryEmpty">Wykonaj rzuty, aby zobaczyć rozkład.</div>
            ) : (
              <div className="diceBarChartInner">
                {distribution.rows.map(([value, count]) => (
                  <div key={value} className="diceBarCol">
                    <span className="diceBarCount">{count}</span>
                    <div className="diceBarTrack">
                      <div className="diceBarFill" style={{ height: `${(count / distribution.peak) * 100}%` }} />
                    </div>
                    <span className="diceBarLabel">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
