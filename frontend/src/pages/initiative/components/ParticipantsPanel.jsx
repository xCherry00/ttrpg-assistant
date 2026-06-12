import { useEffect, useState } from "react";
import { formatHpText, formatParticipantStatus } from "../initiativeUtils";

function ParticipantStateControls({ participant, actionBusy, onMutate }) {
  const [damageValue, setDamageValue] = useState("0");
  const [healValue, setHealValue] = useState("0");
  const [tempValue, setTempValue] = useState(String(participant.tempHp ?? 0));
  const [conditionsValue, setConditionsValue] = useState(participant.conditions || "");

  useEffect(() => {
    setTempValue(String(participant.tempHp ?? 0));
  }, [participant.tempHp]);

  useEffect(() => {
    setConditionsValue(participant.conditions || "");
  }, [participant.conditions]);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="cellInput cellInput--tiny" value={damageValue} onChange={(e) => setDamageValue(e.target.value)} />
        <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "damage", damageValue)} disabled={!!actionBusy}>DMG</button>
        <input className="cellInput cellInput--tiny" value={healValue} onChange={(e) => setHealValue(e.target.value)} />
        <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "heal", healValue)} disabled={!!actionBusy}>HEAL</button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="cellInput cellInput--tiny" value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
        <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "temp", tempValue)} disabled={!!actionBusy}>Set Temp</button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="cellInput cellInput--note" value={conditionsValue} onChange={(e) => setConditionsValue(e.target.value)} />
        <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "conditions", conditionsValue)} disabled={!!actionBusy}>Set Cond.</button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "defeat")} disabled={!!actionBusy}>Defeat</button>
        <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "restore")} disabled={!!actionBusy}>Restore</button>
        <button className="btn btn--tiny" type="button" onClick={() => onMutate(participant.id, "remove")} disabled={!!actionBusy}>Remove</button>
      </div>
    </div>
  );
}

function ParticipantRow({ participant, isTurn, actionBusy, onMutate }) {
  return (
    <tr className={isTurn ? "is-active-turn" : ""}>
      <td>{participant.name}</td>
      <td>{participant.participantType}</td>
      <td>{participant.initiativeValue}</td>
      <td>{participant.initiativeModifier ?? 0}</td>
      <td>{formatHpText(participant.currentHp, participant.maxHp)}</td>
      <td>{participant.tempHp ?? 0}</td>
      <td>{participant.armorClass ?? "-"}</td>
      <td>{participant.conditions || "-"}</td>
      <td>{formatParticipantStatus(participant)}</td>
      <td>
        <ParticipantStateControls participant={participant} actionBusy={actionBusy} onMutate={onMutate} />
      </td>
    </tr>
  );
}

export default function ParticipantsPanel({
  participants,
  currentParticipantId,
  actionBusy,
  onMutate,
  participantTypes,
  customForm,
  onCustomFormChange,
  onSubmitCustom,
  customDisabled,
  campaignCharacters,
  characterForm,
  onCharacterFormChange,
  onSubmitCharacter,
  characterDisabled,
}) {
  return (
    <>
      <section className="initTableWrap initTableWrap--wide">
        {(participants || []).length === 0 ? (
          <div className="empty">
            <div className="emptyTitle">Brak participantow</div>
            <div className="emptyText">Dodaj postać kampanii albo własnego przeciwnika.</div>
          </div>
        ) : (
          <div className="initTableScroll">
            <table className="initTable">
              <thead>
                <tr>
                  <th>Uczestnik</th>
                  <th>Typ</th>
                  <th>Init</th>
                  <th>Modyf.</th>
                  <th>HP</th>
                  <th>Temp</th>
                  <th>AC</th>
                  <th>Conditions</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {(participants || []).map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    isTurn={currentParticipantId === participant.id}
                    actionBusy={actionBusy}
                    onMutate={onMutate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="initControlPanel">
        <form onSubmit={onSubmitCustom} className="initToolbar" style={{ alignItems: "flex-end" }}>
          <span className="initControlLabel">Dodaj custom participant</span>
          <input className="cellInput" placeholder="Nazwa" value={customForm.name} onChange={(e) => onCustomFormChange({ ...customForm, name: e.target.value })} />
          <select className="cellSelect" value={customForm.participantType} onChange={(e) => onCustomFormChange({ ...customForm, participantType: e.target.value })}>
            {participantTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input className="cellInput cellInput--tiny" type="number" placeholder="Init" value={customForm.initiativeValue} onChange={(e) => onCustomFormChange({ ...customForm, initiativeValue: e.target.value })} />
          <input className="cellInput cellInput--tiny" type="number" placeholder="Mod" value={customForm.initiativeModifier} onChange={(e) => onCustomFormChange({ ...customForm, initiativeModifier: e.target.value })} />
          <input className="cellInput cellInput--tiny" type="number" placeholder="Max HP" value={customForm.maxHp} onChange={(e) => onCustomFormChange({ ...customForm, maxHp: e.target.value })} />
          <input className="cellInput cellInput--tiny" type="number" placeholder="Cur HP" value={customForm.currentHp} onChange={(e) => onCustomFormChange({ ...customForm, currentHp: e.target.value })} />
          <button className="btn btn-primary" disabled={customDisabled} type="submit">Dodaj custom</button>
        </form>
      </section>

      <section className="initControlPanel">
        <form onSubmit={onSubmitCharacter} className="initToolbar" style={{ alignItems: "flex-end" }}>
          <span className="initControlLabel">Dodaj postać kampanii</span>
          <select className="cellSelect" value={characterForm.characterId} onChange={(e) => onCharacterFormChange({ ...characterForm, characterId: e.target.value })}>
            <option value="">- wybierz postać -</option>
            {campaignCharacters.map((character) => (
              <option key={character.characterId} value={character.characterId}>{character.characterName}</option>
            ))}
          </select>
          <input className="cellInput cellInput--tiny" type="number" placeholder="Init" value={characterForm.initiativeValue} onChange={(e) => onCharacterFormChange({ ...characterForm, initiativeValue: e.target.value })} />
          <input className="cellInput cellInput--tiny" type="number" placeholder="Mod" value={characterForm.initiativeModifier} onChange={(e) => onCharacterFormChange({ ...characterForm, initiativeModifier: e.target.value })} />
          <input className="cellInput cellInput--tiny" type="number" placeholder="Max HP" value={characterForm.maxHp} onChange={(e) => onCharacterFormChange({ ...characterForm, maxHp: e.target.value })} />
          <input className="cellInput cellInput--tiny" type="number" placeholder="Cur HP" value={characterForm.currentHp} onChange={(e) => onCharacterFormChange({ ...characterForm, currentHp: e.target.value })} />
          <button className="btn btn-primary" disabled={characterDisabled} type="submit">Dodaj postać</button>
        </form>
      </section>
    </>
  );
}
