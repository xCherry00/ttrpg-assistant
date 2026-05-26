export default function CampaignEncounterPanel({
  campaigns,
  campaignLoading,
  campaignError,
  selectedCampaignId,
  onCampaignChange,
  encounterForm,
  onEncounterFormChange,
  onCreateEncounter,
  createEncounterBusy,
  encounters,
  encounterLoading,
  encounterError,
  selectedEncounterId,
  onEncounterChange,
  onTurnAction,
  onEncounterAction,
  actionBusy,
  selectedCampaign,
  activeEncounter,
  activeParticipantsCount,
}) {
  return (
    <>
      <section className="initControlPanel">
        <div className="initSystemBlock">
          <span className="initControlLabel">Kampania</span>
          {campaignLoading ? (
            <div>Ładowanie kampanii...</div>
          ) : (
            <select className="cellSelect" value={selectedCampaignId} onChange={(event) => onCampaignChange(event.target.value)}>
              {campaigns.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          )}
          {campaignError && <div className="campaignDetailsError">{campaignError}</div>}
        </div>

        <form onSubmit={onCreateEncounter} className="initToolbar" style={{ alignItems: "flex-end" }}>
          <label>
            <div className="initControlLabel">Nowy encounter</div>
            <input className="cellInput" value={encounterForm.name} onChange={(e) => onEncounterFormChange({ ...encounterForm, name: e.target.value })} placeholder="np. Starcie w ruinach" />
          </label>
          <label>
            <div className="initControlLabel">System</div>
            <input className="cellInput" value={encounterForm.systemCode} onChange={(e) => onEncounterFormChange({ ...encounterForm, systemCode: e.target.value })} />
          </label>
          <button className="btn btn-primary" disabled={!selectedCampaignId || createEncounterBusy} type="submit">
            {createEncounterBusy ? "Tworzenie..." : "Utwórz encounter"}
          </button>
        </form>
      </section>

      <section className="initControlPanel">
        <div className="initSystemBlock">
          <span className="initControlLabel">Encounter</span>
          {encounterLoading ? (
            <div>Ładowanie encounterów...</div>
          ) : (
            <select className="cellSelect" value={selectedEncounterId} onChange={(event) => onEncounterChange(event.target.value)}>
              <option value="">- wybierz encounter -</option>
              {encounters.map((enc) => (
                <option key={enc.id} value={enc.id}>
                  {enc.name} ({enc.status})
                </option>
              ))}
            </select>
          )}
          {encounterError && <div className="campaignDetailsError">{encounterError}</div>}
        </div>

        <div className="initToolbar">
          <button className="btn" onClick={() => onTurnAction("previous-turn")} disabled={!selectedEncounterId || !!actionBusy} type="button">{"<-"} Poprzednia</button>
          <button className="btn" onClick={() => onTurnAction("next-turn")} disabled={!selectedEncounterId || !!actionBusy} type="button">Następna {"->"}</button>
          <button className="btn" onClick={() => onEncounterAction("finish-encounter")} disabled={!selectedEncounterId || !!actionBusy} type="button">Zakończ</button>
          <button className="btn" onClick={() => onEncounterAction("delete-encounter")} disabled={!selectedEncounterId || !!actionBusy} type="button">Usuń</button>
        </div>
      </section>

      {selectedCampaign && !selectedEncounterId && !encounterLoading && (
        <div className="empty">
          <div className="emptyTitle">Brak encounterów</div>
          <div className="emptyText">Utwórz pierwszy encounter dla kampanii: {selectedCampaign.title}.</div>
        </div>
      )}

      {activeEncounter && (
        <div className="initMeta">
          Encounter: {activeEncounter.name} â€˘ status: {activeEncounter.status} â€˘ runda: {activeEncounter.roundNumber} â€˘ aktywni: {activeParticipantsCount}
        </div>
      )}
    </>
  );
}
