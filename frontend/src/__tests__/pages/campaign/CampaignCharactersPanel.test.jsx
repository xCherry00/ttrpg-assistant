import { render, screen } from "@testing-library/react";
import CampaignCharactersPanel from "../../../pages/campaign/components/CampaignCharactersPanel";

describe("CampaignCharactersPanel", () => {
  it("renders assigned characters list", () => {
    render(
      <CampaignCharactersPanel
        campaignCharacters={[{ characterId: 1, characterName: "Hero", systemCode: "dnd5e", ownerDisplayName: "GM" }]}
        myCharacters={[]}
        canManage={false}
        busy={false}
        onAssign={() => {}}
        onDetach={() => {}}
      />
    );

    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText(/Wlasciciel:/)).toBeInTheDocument();
  });
});
