import { fireEvent, render, screen } from "@testing-library/react";
import CampaignEncounterPanel from "../../../pages/initiative/components/CampaignEncounterPanel";

describe("CampaignEncounterPanel", () => {
  it("renders campaign selector and triggers change", () => {
    const onCampaignChange = vi.fn();
    render(
      <CampaignEncounterPanel
        campaigns={[{ id: 1, title: "A" }, { id: 2, title: "B" }]}
        campaignLoading={false}
        campaignError=""
        selectedCampaignId="1"
        onCampaignChange={onCampaignChange}
        encounterForm={{ name: "", systemCode: "dnd5e", sessionId: "" }}
        onEncounterFormChange={vi.fn()}
        onCreateEncounter={vi.fn()}
        createEncounterBusy={false}
        encounters={[]}
        encounterLoading={false}
        encounterError=""
        selectedEncounterId=""
        onEncounterChange={vi.fn()}
        onTurnAction={vi.fn()}
        onEncounterAction={vi.fn()}
        actionBusy=""
        selectedCampaign={{ id: 1, title: "A" }}
        activeEncounter={null}
        activeParticipantsCount={0}
      />
    );
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "2" } });
    expect(onCampaignChange).toHaveBeenCalledWith("2");
    expect(screen.getByText("Brak encounterów")).toBeInTheDocument();
  });
});
