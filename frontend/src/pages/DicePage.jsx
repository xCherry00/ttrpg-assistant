import { useMemo, useState } from "react";
import "../styles/dice.css";

const DICE = [4, 6, 8, 10, 12, 20, 100];
const HISTORY_MAX = 8;
const MAX_GROUPS = 6;

function newGroup(die = 20) {
  return { id: crypto.randomUUID(), qty: 1, die };
}

export default function DicePage() {
  const [groups, setGroups] = useState([newGroup(20)]);
  const [mod, setMod] = useState(0);
  const [mode, setMode] = useState("normal");
  const [history, setHistory] = useState([]);

  const isAdvDisOn = mode !== "normal";

  function clampInt(v, min, max) {
    const n = Math.trunc(Number(v));
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function pushHistory(entry) {
    setHistory((prev) => [entry, ...prev].slice(0, HISTORY_MAX));
  }

  function updateGroup(id, patch) {
    if (isAdvDisOn) return;
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function changeQty(id, delta) {
    if (isAdvDisOn) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, qty: Math.max(1, Math.min(50, (g.qty || 1) + delta)) } : g
      )
    );
  }

  function addGroup() {
    if (isAdvDisOn) return;
    setGroups((prev) => {
      if (prev.length >= MAX_GROUPS) return prev;
      return [...prev, newGroup(20)];
    });
  }

  function removeGroup(id) {
    if (isAdvDisOn) return;
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      return next.length ? next : [newGroup(20)];
    });
  }

  function resetGroups() {
    setGroups([newGroup(20)]);
    setMod(0);
    setMode("normal");
  }

  function setModeSafe(nextMode) {
    setMode(nextMode);
    if (nextMode !== "normal") {
      setGroups([newGroup(20)]);
    }
  }

  const title = useMemo(() => {
    const m = Math.trunc(Number(mod) || 0);
    const modStr = m === 0 ? "" : m > 0 ? ` + ${m}` : ` − ${Math.abs(m)}`;
    if (isAdvDisOn) {
      const modeStr = mode === "adv" ? "Przewaga" : "Utrudnienie";
      return `2k20 ${modeStr}${modStr}`;
    }
    const parts = groups.map((g) => `${clampInt(g.qty, 1, 50)}k${g.die}`);
    return `${parts.join(" + ")}${modStr}`;
  }, [groups, mod, mode, isAdvDisOn]);

  function doRoll() {
    const m = Math.trunc(Number(mod) || 0);

    if (isAdvDisOn) {
      const a = rollDie(20);
      const b = rollDie(20);
      const isAdv = mode === "adv";
      const chosenVal = isAdv ? Math.max(a, b) : Math.min(a, b);
      const chosenIdx = isAdv ? (a >= b ? 0 : 1) : (a <= b ? 0 : 1);
      const total = chosenVal + m;
      pushHistory({
        id: crypto.randomUUID(), title, mode,
        groups: [{ qty: 1, die: 20, rolls: [a, b], chosen: chosenVal }],
        mod: m, total,
        note: isAdv ? `Przewaga → wyższy: ${chosenVal}` : `Utrudnienie → niższy: ${chosenVal}`,
        advRolls: { a, b, chosen: chosenVal, chosenIdx },
      });
      return;
    }

    const normalized = groups.map((g) => ({
      qty: clampInt(g.qty, 1, 50),
      die: clampInt(g.die, 2, 1000),
    }));
    const groupsResult = normalized.map((g) => {
      const rolls = Array.from({ length: g.qty }, () => rollDie(g.die));
      const sum = rolls.reduce((a, b) => a + b, 0);
      return { qty: g.qty, die: g.die, rolls, sum };
    });
    const diceSum = groupsResult.reduce((a, x) => a + x.sum, 0);
    const total = diceSum + m;
    pushHistory({
      id: crypto.randomUUID(), title, mode: "normal",
      groups: groupsResult, mod: m, total, note: "",
    });
  }

  function clearHistory() {
    setHistory([]);
  }

  const latestRoll = history[0] || null;
  const canShowAddButton = !isAdvDisOn && groups.length < MAX_GROUPS;

  return (
    <div className="page">
      <div className="pageHeader dicePageHeader">
        <div>
          <h1 className="pageTitle">Symulator kości</h1>
          <p className="pageSubtitle">
            Do {MAX_GROUPS} typów kości jednocześnie. Advantage / Disadvantage — D&D 5e (2k20).
          </p>
        </div>
      </div>

      <div className="diceLayout">
        {/* LEFT — konfiguracja */}
        <section className="dicePanel">
          <div className="dicePanelHeader">
            <div className="dicePanelTitle">Konfiguracja rzutu</div>
            <div className="diceFormula">{title}</div>
          </div>

          <div className="diceGrid">
            {/* Kości */}
            <div className="diceField">
              <div className="diceFieldLabel">
                Kości
                <span className="diceFieldHint">{groups.length}/{MAX_GROUPS} typów</span>
              </div>
              <div className="diceGroups">
                {groups.map((g, idx) => (
                  <div key={g.id} className={`diceGroupCard ${isAdvDisOn ? "is-locked" : ""}`}>
                    <div className="diceGroupTop">
                      <span className="diceGroupIndex">{idx + 1}</span>
                      <div className="diceQtyControl">
                        <button
                          type="button" className="diceQtyStep"
                          onClick={() => changeQty(g.id, -1)}
                          disabled={isAdvDisOn || g.qty <= 1}
                          aria-label="Zmniejsz ilość"
                        >−</button>
                        <span className="diceQtyNum">{g.qty}</span>
                        <button
                          type="button" className="diceQtyStep"
                          onClick={() => changeQty(g.id, 1)}
                          disabled={isAdvDisOn || g.qty >= 50}
                          aria-label="Zwiększ ilość"
                        >+</button>
                      </div>
                      <button
                        type="button" className="diceRemoveBtn"
                        onClick={() => removeGroup(g.id)}
                        disabled={isAdvDisOn}
                        aria-label="Usuń typ kości"
                      >×</button>
                    </div>
                    <div className="diceDieChips">
                      {DICE.map((d) => (
                        <button
                          key={d} type="button"
                          className={`diceDieChip ${g.die === d ? "is-active" : ""}`}
                          onClick={() => updateGroup(g.id, { die: d })}
                          disabled={isAdvDisOn}
                        >
                          k{d}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {canShowAddButton && (
                <button className="diceAddBtn" type="button" onClick={addGroup}>+ Dodaj typ kości</button>
              )}
            </div>

            {/* Modyfikator */}
            <div className="diceField">
              <div className="diceFieldLabel">Modyfikator</div>
              <input
                className="diceModInput"
                type="number" value={mod}
                onChange={(e) => setMod(e.target.value)}
              />
            </div>

            {/* Tryb */}
            <div className="diceField">
              <div className="diceFieldLabel">Tryb rzutu</div>
              <div className="diceModeRow">
                {[
                  { key: "normal", label: "Normalny" },
                  { key: "adv",    label: "Przewaga" },
                  { key: "dis",    label: "Utrudnienie" },
                ].map(({ key, label }) => (
                  <button
                    key={key} type="button"
                    className={`diceModeChip ${mode === key ? "is-active" : ""}`}
                    onClick={() => setModeSafe(key)}
                  >{label}</button>
                ))}
              </div>
              {isAdvDisOn && (
                <div className="diceAdvNote">
                  Rzucasz 2k20 i wybierasz {mode === "adv" ? "wyższy" : "niższy"} wynik (D&D 5e).
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="diceActions">
            <button className="diceRollBtn" type="button" onClick={doRoll}>Rzuć kośćmi</button>
            {(history.length > 0 || groups.length > 1 || mod !== 0) && (
              <button className="diceClearBtn" type="button" onClick={resetGroups} title="Reset do 1k20">
                Reset
              </button>
            )}
            {history.length > 0 && (
              <button className="diceClearBtn" type="button" onClick={clearHistory}>Wyczyść historię</button>
            )}
          </div>
        </section>

        {/* RIGHT — wyniki */}
        <section className="dicePanel dicePanel--results">
          {latestRoll ? (
            <>
              <div className="diceResult">
                <div className="diceResultLabel">{latestRoll.title}</div>

                {/* Adv/Dis — wizualny podgląd obu k20 */}
                {latestRoll.advRolls && (
                  <div className="diceAdvDice">
                    <div className={`diceAdvDie ${latestRoll.advRolls.chosenIdx === 0 ? "is-chosen" : "is-dropped"}`}>
                      {latestRoll.advRolls.a}
                    </div>
                    <span className="diceAdvVs">vs</span>
                    <div className={`diceAdvDie ${latestRoll.advRolls.chosenIdx === 1 ? "is-chosen" : "is-dropped"}`}>
                      {latestRoll.advRolls.b}
                    </div>
                  </div>
                )}

                <div className="diceResultNumber">{latestRoll.total}</div>
                {latestRoll.note && <div className="diceResultNote">{latestRoll.note}</div>}

                {!latestRoll.advRolls && (
                  <div className="diceResultBreakdown">
                    {latestRoll.groups.map((g, i) => (
                      <span key={i} className="diceResultGroup">
                        {g.qty}k{g.die}: [{Array.isArray(g.rolls) ? g.rolls.join(", ") : ""}]
                      </span>
                    ))}
                    {latestRoll.mod !== 0 && (
                      <span className="diceResultGroup">
                        mod: {latestRoll.mod > 0 ? `+${latestRoll.mod}` : latestRoll.mod}
                      </span>
                    )}
                  </div>
                )}
                {latestRoll.advRolls && latestRoll.mod !== 0 && (
                  <div className="diceResultBreakdown">
                    <span className="diceResultGroup">
                      mod: {latestRoll.mod > 0 ? `+${latestRoll.mod}` : latestRoll.mod}
                    </span>
                  </div>
                )}
              </div>

              {history.length > 1 && (
                <div className="diceHistorySection">
                  <div className="diceHistoryTitle">Historia ({history.length}/{HISTORY_MAX})</div>
                  <div className="diceHistory">
                    {history.slice(1).map((h) => (
                      <article key={h.id} className="rollCard">
                        <div className="rollTop">
                          <div className="rollTitle">{h.title}</div>
                          <div className="rollTotal">{h.total}</div>
                        </div>
                        {h.note && <div className="rollNote">{h.note}</div>}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="diceEmptyState">
              <div className="diceEmptyIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/>
                  <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              <div className="diceEmptyTitle">Brak rzutów</div>
              <div className="diceEmptyText">Ustaw kości i kliknij „Rzuć kośćmi".</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
