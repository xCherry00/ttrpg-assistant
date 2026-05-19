import { useEffect, useMemo, useState } from "react";
import "../styles/initiative.css";
import { apiFetch } from "../lib/api";

const TYPE_OPTIONS = [
  { value: "enemy", label: "Wróg" },
  { value: "friendly", label: "Przyjazny" },
  { value: "player", label: "Gracz" },
];

const INIT_CACHE_KEY = "ttrpg_initiative_rows_v2";
const INIT_SYSTEM_KEY = "ttrpg_initiative_system_v1";

const SYSTEM_CONFIG = {
  dnd: {
    label: "D&D",
    hasRoll: true,
    hasCompendium: true,
    columns: ["participant", "type", "initiative", "ac", "hpMax", "hp", "note", "delete"],
  },
  coc: {
    label: "Zew Cthulhu",
    hasRoll: false,
    hasCompendium: false,
    columns: ["participant", "type", "dex", "hp", "armor", "attacksNote", "delete"],
  },
};

const DEFAULT_FORM = {
  type: "enemy",
  name: "",
  count: 1,
  mod: 0,
  ac: 10,
  hpMax: 10,
  note: "",
  dex: 50,
  hp: 10,
  armor: "",
  attacksNote: "",
};

function normalizeMonster(m) {
  const name =
    m.namePl ??
    m.namePL ??
    m.name_pl ??
    m.nameEn ??
    m.nameEN ??
    m.name_en ??
    m.name ??
    m.nazwa ??
    m.monsterName ??
    m.monster_name ??
    m.title ??
    m.monster_title ??
    m.label ??
    m.displayName ??
    "";

  const dexterity = m.dexterity ?? m.dex ?? m.abilities?.dexterity ?? null;

  // // initiative mod
  const initMod =
    m.initiativeMod ??
    m.initiative_mod ??
    m.initMod ??
    m.init_mod ??
    m.mod ??
    m.modifier ??
    (Number.isFinite(parseInt(dexterity, 10)) ? Math.floor((parseInt(dexterity, 10) - 10) / 2) : null) ??
    0;

  const armorClassValue = Array.isArray(m.armor_class)
    ? m.armor_class[0]?.value
    : m.armor_class;

  // // ac
  const ac =
    m.armorClass ??
    m.ac ??
    armorClassValue ??
    m.armor_class ??
    m.armorClassValue ??
    m.armor_class_value ??
    m.armor ??
    10;

  // // hp
  const hp =
    m.hitPoints ??
    m.hp ??
    m.hpMax ??
    m.hp_max ??
    m.maxHp ??
    m.hit_points ??
    10;

  return {
    id: m.id ?? m.index,
    index: m.index,
    name: String(name || "").trim(),
    initiativeMod: Number.isFinite(parseInt(initMod, 10)) ? parseInt(initMod, 10) : 0,
    mod: Number.isFinite(parseInt(initMod, 10)) ? parseInt(initMod, 10) : 0,
    ac: Number.isFinite(parseInt(ac, 10)) ? parseInt(ac, 10) : 10,
    hpMax: Math.max(1, Number.isFinite(parseInt(hp, 10)) ? parseInt(hp, 10) : 10),
  };
}

export default function InitiativePage() {
  const [rows, setRows] = useState([]);
  const [system, setSystem] = useState("dnd");
  const [currentTurnIndex, setCurrentTurnIndex] = useState(null);
  const [hydrated, setHydrated] = useState(false); // // <- KLUCZ: blokuje zapis zanim wczytamy cache
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const [monsters, setMonsters] = useState([]);
  const [monstersLoading, setMonstersLoading] = useState(false);
  const [monstersError, setMonstersError] = useState("");
  const [selectedMonsterId, setSelectedMonsterId] = useState("");

  const [form, setForm] = useState(DEFAULT_FORM);

  const config = SYSTEM_CONFIG[system] || SYSTEM_CONFIG.dnd;
  const columns = config.columns;

  const nextId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Math.random()).slice(2);

  function toInt(v, fallback = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function clampHpMinOnly(hp) {
    const h = toInt(hp, 0);
    return Math.max(0, h);
  }

  function hpClass(hp, hpMax) {
    const h = toInt(hp, NaN);
    const m = toInt(hpMax, NaN);

    if (!Number.isFinite(h) || !Number.isFinite(m) || m <= 0) return "hp--na";
    if (h <= 0) return "hp--zero";
    if (h > m) return "hp--over";

    const pct = (h / m) * 100;
    if (pct >= 75) return "hp--green";
    if (pct >= 50) return "hp--yellow";
    if (pct >= 25) return "hp--orange";
    return "hp--red";
  }

  function normalizeRow(row, fallbackSystem = "dnd") {
    const rowSystem = row.system === "coc" || row.system === "dnd" ? row.system : fallbackSystem;
    const initiativeMod = row.initiativeMod ?? row.mod ?? 0;
    const hpMax = Math.max(1, toInt(row.hpMax ?? row.hp ?? 1, 1));
    const dex = row.dex == null ? null : toInt(row.dex, null);

    return {
      id: row.id || nextId(),
      system: rowSystem,
      type: row.type || "enemy",
      name: row.name || "Nowy",
      initiativeMod: rowSystem === "dnd" ? toInt(initiativeMod, 0) : null,
      baseRoll: rowSystem === "dnd" ? row.baseRoll ?? null : null,
      initiative: row.initiative ?? (rowSystem === "coc" ? dex ?? 50 : null),
      dex,
      ac: rowSystem === "dnd" ? toInt(row.ac, 10) : null,
      armor: row.armor ?? "",
      hpMax,
      hp: clampHpMinOnly(row.hp ?? hpMax),
      note: row.note || "",
      attacksNote: row.attacksNote || "",
      dmgHeal: row.dmgHeal || "",
    };
  }

  function createDndRow(name) {
    const hpMax = Math.max(1, toInt(form.hpMax, 10));
    return {
      id: nextId(),
      system: "dnd",
      type: form.type,
      name,
      initiativeMod: toInt(form.mod, 0),
      baseRoll: 0,
      initiative: 0,
      dex: null,
      ac: toInt(form.ac, 10),
      armor: null,
      hpMax,
      hp: hpMax,
      note: form.note || "",
      attacksNote: "",
      dmgHeal: "",
    };
  }

  function createCocRow(name) {
    const dex = toInt(form.dex, 50);
    const hp = Math.max(1, toInt(form.hp, 1));
    return {
      id: nextId(),
      system: "coc",
      type: form.type,
      name,
      initiativeMod: null,
      baseRoll: null,
      initiative: dex,
      dex,
      ac: null,
      armor: form.armor || "",
      hpMax: hp,
      hp,
      note: "",
      attacksNote: form.attacksNote || "",
      dmgHeal: "",
    };
  }

  function sortDndRows(list) {
    return [...list].sort((a, b) =>
      Number(b.initiative ?? -9999) - Number(a.initiative ?? -9999) ||
      Number(b.baseRoll ?? -1) - Number(a.baseRoll ?? -1) ||
      (a.name || "").localeCompare(b.name || "", "pl")
    );
  }

  function sortCocRows(list) {
    return [...list].sort((a, b) =>
      Number(b.dex ?? 0) - Number(a.dex ?? 0) ||
      (a.name || "").localeCompare(b.name || "", "pl")
    );
  }

  function sortRows(list, selectedSystem = system) {
    if (selectedSystem === "coc") return sortCocRows(list);
    return sortDndRows(list);
  }

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  // =========================================================
  // CACHE (SESSION) — NAJPIERW WCZYTAJ, POTEM ZAPISUJ
  // =========================================================
  useEffect(() => {
    try {
      const storedSystem = sessionStorage.getItem(INIT_SYSTEM_KEY);
      if (storedSystem === "dnd" || storedSystem === "coc") setSystem(storedSystem);

      const raw = sessionStorage.getItem(INIT_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRows(parsed.map((row) => normalizeRow(row, storedSystem || "dnd")));
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true); // // dopiero teraz pozwalamy na zapis
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return; // // <- BLOKADA zapisu zanim wczytamy
    try {
      sessionStorage.setItem(INIT_CACHE_KEY, JSON.stringify(rows));
      sessionStorage.setItem(INIT_SYSTEM_KEY, system);
    } catch {
      // ignore
    }
  }, [rows, system, hydrated]);

  // Modal UX: ESC + blokada scrolla
  useEffect(() => {
    if (!isModalOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Load monsters only when modal open
  useEffect(() => {
    if (!isModalOpen || !config.hasCompendium) return;

    let cancelled = false;

    async function loadMonsters() {
      setMonstersLoading(true);
      setMonstersError("");

      try {
        const data = await apiFetch("/api/compendium/dnd5e/monsters");
        if (cancelled) return;

        const list = Array.isArray(data?.results) ? data.results : [];
        setMonsters(list.map((monster) => ({
          id: monster.index,
          index: monster.index,
          name: monster.name,
          ac: "?",
          hpMax: "?",
          initiativeMod: "?",
          source: "D&D 5E SRD",
        })));
      } catch (e) {
        if (cancelled) return;
        setMonsters([]);
        setMonstersError(e?.message || "Nie udało się pobrać potworów.");
      } finally {
        if (!cancelled) setMonstersLoading(false);
      }
    }

    loadMonsters();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, config.hasCompendium]);

  async function onPickMonster(monsterId) {
    if (!config.hasCompendium) return;
    setSelectedMonsterId(monsterId);

    const m = monsters.find((x) => String(x.id) === String(monsterId));
    if (!m) return;

    let selected = normalizeMonster(m);
    try {
      setMonstersLoading(true);
      const detail = await apiFetch(`/api/compendium/dnd5e/monsters/${m.index || m.id}`);
      selected = normalizeMonster(detail);
      setMonstersError("");
    } catch (e) {
      setMonstersError(e?.message || "Nie udało się pobrać statystyk potwora.");
    } finally {
      setMonstersLoading(false);
    }

    setForm((p) => ({
      ...p,
      type: "enemy",
      name: selected.name,
      mod: toInt(selected.initiativeMod, 0),
      ac: toInt(selected.ac, 10),
      hpMax: Math.max(1, toInt(selected.hpMax, 10)),
    }));
  }

  function addRowsFromForm() {
    const count = Math.max(1, toInt(form.count, 1));
    const baseName = (form.name || "").trim() || "Nowy";

    const newRows = [];
    for (let i = 1; i <= count; i++) {
      const name = count > 1 ? `${baseName} ${i}` : baseName;
      newRows.push(system === "coc" ? createCocRow(name) : createDndRow(name));
    }

    setRows((prev) => [...prev, ...newRows]);
    setIsModalOpen(false);

    setSelectedMonsterId("");
    setForm((p) => ({ ...p, name: "", count: 1, note: "", attacksNote: "" }));
  }

  function rollInitiativeForAll() {
    if (!config.hasRoll) {
      sortByDex();
      return;
    }
    setRows((prev) =>
      sortRows(prev.map((r) => {
        const roll = 1 + Math.floor(Math.random() * 20);
        const total = roll + toInt(r.initiativeMod ?? r.mod, 0);
        return { ...r, baseRoll: roll, initiative: total };
      }), "dnd")
    );
    setCurrentTurnIndex(0);
  }

  function sortRowsByInitiative() {
    setRows((prev) => sortRows(prev, system));
    setCurrentTurnIndex(0);
  }

  function sortByDex() {
    setRows((prev) =>
      sortCocRows(prev.map((row) => ({
        ...row,
        dex: row.dex ?? 50,
        initiative: Number(row.dex ?? 50),
      })))
    );
    setCurrentTurnIndex(0);
  }

  function nextTurn() {
    if (currentTurnIndex == null || rows.length === 0) return;
    setCurrentTurnIndex((prev) => (prev < rows.length - 1 ? prev + 1 : 0));
  }

  function prevTurn() {
    if (currentTurnIndex == null || rows.length === 0) return;
    setCurrentTurnIndex((prev) => (prev > 0 ? prev - 1 : rows.length - 1));
  }

  function rollInitiativeForRow(id) {
    if (!config.hasRoll) return;
    setRows((prev) =>
      sortRows(prev.map((r) => {
        if (r.id !== id) return r;
        const roll = 1 + Math.floor(Math.random() * 20);
        const total = roll + toInt(r.initiativeMod ?? r.mod, 0);
        return { ...r, baseRoll: roll, initiative: total };
      }), "dnd")
    );
  }

  function clearAll() {
    setRows([]);
    setCurrentTurnIndex(null);
    try {
      sessionStorage.removeItem(INIT_CACHE_KEY);
      sessionStorage.removeItem(INIT_SYSTEM_KEY);
    } catch {
      // ignore
    }
  }

  function applyDmg(id) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const amt = Math.max(0, toInt(r.dmgHeal, 0));
        const newHp = clampHpMinOnly(toInt(r.hp, 0) - amt);
        return { ...r, hp: newHp, dmgHeal: "" };
      })
    );
  }

  function applyHeal(id) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const amt = Math.max(0, toInt(r.dmgHeal, 0));
        const newHp = clampHpMinOnly(toInt(r.hp, 0) + amt);
        return { ...r, hp: newHp, dmgHeal: "" };
      })
    );
  }

  const countText = useMemo(
    () => `${rows.length} uczestników • system: ${config.label} • kolejność zmienia się dopiero po Sortuj`,
    [config.label, rows.length]
  );

  // =========================================================
  // DRAG & DROP HANDLERS
  // =========================================================
  function handleDragStart(e, id) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(e, id) {
    e.preventDefault();
    setDragOverId(id);
  }

  function handleDragLeave(e) {
    // Only leave if moving outside the row
    if (e.target.closest('.initGridRow') === null) {
      setDragOverId(null);
    }
  }

  function handleDrop(e, targetId) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Find indices
    const draggedIdx = rows.findIndex(r => r.id === draggedId);
    const targetIdx = rows.findIndex(r => r.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Reorder rows
    const newRows = [...rows];
    const [draggedRow] = newRows.splice(draggedIdx, 1);
    newRows.splice(targetIdx, 0, draggedRow);
    
    setRows(newRows);
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div className="page page--wide initiativePage">
      <div className="pageHeader">
        <div>
          <span className="pageEyebrow">narzędzia</span>
          <h1 className="pageTitle">Kolejka inicjatywy</h1>
          <p className="pageSubtitle">
            Dodaj uczestników, prowadź kolejność tur i aktualizuj HP dla D&D albo Zewu Cthulhu.
          </p>
        </div>
      </div>

      <section className="initControlPanel">
        <div className="initSystemBlock">
          <span className="initControlLabel">System walki</span>
          <div className="initSystemSwitch" aria-label="System walki">
            {Object.entries(SYSTEM_CONFIG).map(([key, item]) => (
              <button
                key={key}
                className={`initSystemBtn${system === key ? " is-active" : ""}`}
                type="button"
                onClick={() => setSystem(key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="initToolbar">
          <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}>
            + Dodaj
          </button>

          <button className="btn" type="button" onClick={config.hasRoll ? rollInitiativeForAll : sortByDex} disabled={rows.length === 0}>
            {config.hasRoll ? "Rzuć inicjatywę" : "Sortuj według DEX"}
          </button>

          {config.hasRoll && <button className="btn" type="button" onClick={sortRowsByInitiative} disabled={rows.length === 0}>
            Sortuj
          </button>}

          <div className="initTurnButtons">
            <button className="btn" type="button" onClick={prevTurn} disabled={currentTurnIndex == null || rows.length === 0} title="Poprzednia tura">
              ← Cofnij
            </button>
            <button className="btn" type="button" onClick={nextTurn} disabled={currentTurnIndex == null || rows.length === 0} title="Następna tura">
              Dalej →
            </button>
          </div>

          <button className="btn" type="button" onClick={clearAll} disabled={rows.length === 0}>
            Wyczyść
          </button>
        </div>
      </section>

      <div className="initSystemNotice">
        Zmiana systemu wpływa na formularz i kolumny. Obecni uczestnicy zostają, ale część pól może być ukryta.
      </div>

      <div className="initTableWrap initTableWrap--wide">
        <div className="initTableScroll">
          <div className={`initGrid initGrid--${system}`}>
            <div className="initGridHeader">
              {columns.includes("participant") && <div className="cellCenter">Uczestnik</div>}
              {columns.includes("type") && <div className="cellCenter">Typ</div>}
              {columns.includes("initiative") && <div className="cellCenter">Inicjatywa</div>}
              {columns.includes("dex") && <div className="cellCenter">DEX</div>}
              {columns.includes("ac") && <div className="cellCenter">AC</div>}
              {columns.includes("hpMax") && <div className="cellCenter">Max HP</div>}
              {columns.includes("hp") && <div className="cellCenter">HP</div>}
              {columns.includes("armor") && <div className="cellCenter">Armor</div>}
              {columns.includes("note") && <div className="cellCenter">Notatka</div>}
              {columns.includes("attacksNote") && <div className="cellCenter">Ataki / Notatki</div>}
              {columns.includes("delete") && <div className="cellCenter" aria-label="Akcje"></div>}
            </div>

            {rows.map((r, idx) => (
              <div
                key={r.id}
                className={[
                  "initGridRow",
                  "rowType",
                  r.type === "player" ? "rowType--player" : "",
                  r.type === "enemy" ? "rowType--enemy" : "",
                  r.type === "friendly" ? "rowType--friendly" : "",
                  draggedId === r.id ? "is-dragging" : "",
                  dragOverId === r.id ? "is-drag-over" : "",
                  currentTurnIndex === idx ? "is-active-turn" : "",
                ].join(" ")}
                draggable
                onDragStart={(e) => handleDragStart(e, r.id)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, r.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, r.id)}
                onDragEnd={handleDragEnd}
              >
                {columns.includes("participant") && <div className="cellBox">
                  <div className="nameCell nameCell--center">
                    <input
                      className="nameInput"
                      value={r.name ?? ""}
                      onChange={(e) => updateRow(r.id, { name: e.target.value })}
                      placeholder="Nazwa…"
                    />
                  </div>
                </div>}

                {columns.includes("type") && <div className="cellCenter cellBox">
                  <select
                    className="cellSelect"
                    value={r.type}
                    onChange={(e) => updateRow(r.id, { type: e.target.value })}
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>}

                {columns.includes("initiative") && <div className="cellCenter cellBox initInitiativeCell">
                  <input
                    className="cellInput cellInput--init"
                    type="number"
                    value={r.initiative ?? ""}
                    onChange={(e) => updateRow(r.id, { initiative: toInt(e.target.value, null) })}
                    placeholder="—"
                  />
                  {config.hasRoll && <button className="btn btn--tiny initRerollBtn" type="button" onClick={() => rollInitiativeForRow(r.id)} title="Rzuć dla tej postaci" aria-label="Rzuć inicjatywę">
                    ↻
                  </button>}
                </div>}

                {columns.includes("dex") && <div className="cellCenter cellBox">
                  <input
                    className="cellInput cellInput--tiny"
                    type="number"
                    value={r.dex ?? ""}
                    onChange={(e) => {
                      const dex = toInt(e.target.value, 0);
                      updateRow(r.id, { dex, initiative: dex });
                    }}
                    placeholder="50"
                  />
                </div>}

                {columns.includes("ac") && <div className="cellCenter cellBox">
                  <input
                    className="cellInput cellInput--tiny"
                    type="number"
                    value={r.ac ?? ""}
                    onChange={(e) => updateRow(r.id, { ac: toInt(e.target.value, 0) })}
                    placeholder="—"
                  />
                </div>}

                {columns.includes("hpMax") && <div className="cellCenter cellBox">
                  <input
                    className="cellInput cellInput--tiny"
                    type="number"
                    min="1"
                    value={r.hpMax ?? ""}
                    onChange={(e) => updateRow(r.id, { hpMax: Math.max(1, toInt(e.target.value, 10)) })}
                    placeholder="—"
                  />
                </div>}

                {columns.includes("hp") && <div className="cellBox hpCell">
                  <div className="hpTop">
                    <div className={"hpPill " + hpClass(r.hp, r.hpMax)}>
                      <input
                        className="hpInput"
                        type="number"
                        value={r.hp ?? ""}
                        onChange={(e) => updateRow(r.id, { hp: clampHpMinOnly(e.target.value) })}
                        placeholder="—"
                      />
                    </div>
                  </div>

                  <div className="hpMiniActions">
                    <input
                      className="cellInput cellInput--tiny"
                      type="number"
                      value={r.dmgHeal}
                      onChange={(e) => updateRow(r.id, { dmgHeal: e.target.value })}
                      placeholder="np. 7"
                    />
                    <button className="btn btn--tiny" type="button" onClick={() => applyDmg(r.id)}>
                      DMG
                    </button>
                    <button className="btn btn--tiny" type="button" onClick={() => applyHeal(r.id)}>
                      HEAL
                    </button>
                  </div>
                </div>}

                {columns.includes("armor") && <div className="cellBox">
                  <input
                    className="cellInput cellInput--note"
                    value={r.armor ?? ""}
                    onChange={(e) => updateRow(r.id, { armor: e.target.value })}
                    placeholder="np. 1 punkt, kurtka, brak"
                  />
                </div>}

                {columns.includes("note") && <div className="cellBox">
                  <input
                    className="cellInput cellInput--note"
                    value={r.note ?? ""}
                    onChange={(e) => updateRow(r.id, { note: e.target.value })}
                    placeholder="np. łucznik / koncentracja / warunki…"
                  />
                </div>}

                {columns.includes("attacksNote") && <div className="cellBox">
                  <input
                    className="cellInput cellInput--note"
                    value={r.attacksNote ?? ""}
                    onChange={(e) => updateRow(r.id, { attacksNote: e.target.value })}
                    placeholder="np. pistolet 1k10, nóż, ucieka"
                  />
                </div>}

                {columns.includes("delete") && <div className="cellCenter cellBox">
                  <button className="btn btn--icon" type="button" onClick={() => removeRow(r.id)} title="Usuń" aria-label="Usuń uczestnika">
                    ×
                  </button>
                </div>}
              </div>
            ))}

            {rows.length === 0 && (
              <div style={{ padding: 12 }}>
                <div className="empty">
                  <div className="emptyTitle">Brak uczestników</div>
                  <div className="emptyText">Kliknij „+ Dodaj”, aby utworzyć listę inicjatywy.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="initMeta">{countText}</div>
      </div>

      {isModalOpen && (
        <div className="modalOverlay" onMouseDown={() => setIsModalOpen(false)}>
          <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalTop modalTop--center">
              <div className="modalTitle">Dodaj uczestnika</div>
            </div>

            <div className="modalBody">
              {config.hasCompendium && <div className="monsterBlock">
                <div className="monsterBlockTop">
                  <div className="rangeLabel">Gotowy przeciwnik z kompendium</div>

                  <select
                    className="cellSelect monsterSelect"
                    value={selectedMonsterId}
                    onChange={(e) => onPickMonster(e.target.value)}
                  >
                    <option value="">— wybierz potwora —</option>
                    {monsters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || "(bez nazwy)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="monsterHint">
                  {monstersLoading && <span style={{ fontWeight: 700 }}>Ładowanie potworów…</span>}
                  {!!monstersError && <span style={{ fontWeight: 800 }}>⚠ {monstersError}</span>}
                </div>
              </div>}

              <div className="modalGrid2">
                <div className="modalCol">
                  <div className="formField">
                    <div className="rangeLabel">Typ</div>
                    <select
                      className="cellSelect"
                      value={form.type}
                      onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    >
                      {TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="formField">
                    <div className="rangeLabel">Nazwa</div>
                    <input
                      className="cellInput"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="np. Goblin"
                    />
                  </div>

                  {system === "dnd" && <div className="formField">
                    <div className="rangeLabel">Notatka</div>
                    <input
                      className="cellInput"
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="np. łucznik, tarcza, warunki…"
                    />
                  </div>}

                  {system === "coc" && <div className="formField">
                    <div className="rangeLabel">Ataki / Notatki</div>
                    <input
                      className="cellInput"
                      value={form.attacksNote}
                      onChange={(e) => setForm((p) => ({ ...p, attacksNote: e.target.value }))}
                      placeholder="np. rewolwer, nóż, osłabiony…"
                    />
                  </div>}
                </div>

                <div className="modalCol modalCol--numbers">
                  <div className="formField">
                    <div className="rangeLabel">Ile sztuk</div>
                    <input
                      className="cellInput cellInput--num"
                      type="number"
                      min={1}
                      max={50}
                      value={form.count}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, count: Math.max(1, toInt(e.target.value, 1)) }))
                      }
                    />
                  </div>

                  {system === "dnd" && <div className="formField">
                    <div className="rangeLabel">Mod inicjatywy</div>
                    <input
                      className="cellInput cellInput--num"
                      type="number"
                      value={form.mod}
                      onChange={(e) => setForm((p) => ({ ...p, mod: toInt(e.target.value, 0) }))}
                    />
                  </div>}

                  {system === "dnd" && <div className="formField">
                    <div className="rangeLabel">AC</div>
                    <input
                      className="cellInput cellInput--num"
                      type="number"
                      value={form.ac}
                      onChange={(e) => setForm((p) => ({ ...p, ac: toInt(e.target.value, 10) }))}
                    />
                  </div>}

                  {system === "dnd" && <div className="formField">
                    <div className="rangeLabel">HP Max (stałe)</div>
                    <input
                      className="cellInput cellInput--num"
                      type="number"
                      min={1}
                      value={form.hpMax}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, hpMax: Math.max(1, toInt(e.target.value, 10)) }))
                      }
                    />
                  </div>}

                  {system === "coc" && <div className="formField">
                    <div className="rangeLabel">DEX</div>
                    <input
                      className="cellInput cellInput--num"
                      type="number"
                      value={form.dex}
                      onChange={(e) => setForm((p) => ({ ...p, dex: toInt(e.target.value, 50) }))}
                    />
                  </div>}

                  {system === "coc" && <div className="formField">
                    <div className="rangeLabel">HP</div>
                    <input
                      className="cellInput cellInput--num"
                      type="number"
                      min={1}
                      value={form.hp}
                      onChange={(e) => setForm((p) => ({ ...p, hp: Math.max(1, toInt(e.target.value, 1)) }))}
                    />
                  </div>}

                  {system === "coc" && <div className="formField">
                    <div className="rangeLabel">Armor</div>
                    <input
                      className="cellInput cellInput--num"
                      value={form.armor}
                      onChange={(e) => setForm((p) => ({ ...p, armor: e.target.value }))}
                      placeholder="np. 1"
                    />
                  </div>}
                </div>
              </div>
            </div>

            <div className="modalActions">
              <button className="btn" type="button" onClick={() => setIsModalOpen(false)}>
                Anuluj
              </button>
              <button className="btn btn-primary" type="button" onClick={addRowsFromForm}>
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
