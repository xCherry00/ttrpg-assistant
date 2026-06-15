import { formatRollSummary } from "../initiativeUtils";

export default function DiceRollPanel({
  rollTypes,
  form,
  onFormChange,
  onSubmit,
  disabled,
  diceLoading,
  diceRolls,
  diceError,
  selectedEncounterId,
}) {
  return (
    <>
      <section className="initControlPanel">
        <form onSubmit={onSubmit} className="initToolbar" style={{ alignItems: "flex-end" }}>
          <span className="initControlLabel">Szybki rzut (zapis do historii)</span>
          <input className="cellInput" placeholder="np. 1d20+3" value={form.rollExpression} onChange={(e) => onFormChange({ ...form, rollExpression: e.target.value })} />
          <input className="cellInput" placeholder="Label (opcjonalnie)" value={form.rollLabel} onChange={(e) => onFormChange({ ...form, rollLabel: e.target.value })} />
          <select className="cellSelect" value={form.rollType} onChange={(e) => onFormChange({ ...form, rollType: e.target.value })}>
            {rollTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <button className="btn btn-primary" disabled={disabled} type="submit">Rzuc</button>
        </form>
      </section>

      <section className="initTableWrap initTableWrap--wide">
        <div className="initMeta">Historia rzutów {selectedEncounterId ? "(filtrowana po encounterze)" : "(kampania)"}</div>
        {diceLoading ? (
          <div>Ładowanie rzutów...</div>
        ) : diceRolls.length === 0 ? (
          <div className="empty">
            <div className="emptyTitle">Brak rzutów</div>
            <div className="emptyText">Wykonaj pierwszy rzut, aby zapisać go w historii.</div>
          </div>
        ) : (
          <div className="initTableScroll">
            <table className="initTable">
              <thead>
                <tr>
                  <th>Expression</th>
                  <th>Total</th>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Autor</th>
                  <th>Czas</th>
                </tr>
              </thead>
              <tbody>
                {diceRolls.map((roll) => (
                  <tr key={roll.id}>
                    <td>{formatRollSummary(roll)}</td>
                    <td>{roll.total}</td>
                    <td>{roll.rollLabel || "-"}</td>
                    <td>{roll.rollType}</td>
                    <td>{roll.rolledByUsername || roll.rolledByUserId}</td>
                    <td>{new Date(roll.createdAt).toLocaleString("pl-PL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {diceError && <div className="campaignDetailsError">{diceError}</div>}
      </section>
    </>
  );
}
