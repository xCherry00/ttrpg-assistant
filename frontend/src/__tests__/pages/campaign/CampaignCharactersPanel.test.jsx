import { render, screen } from "@testing-library/react";
import CampaignCharactersPanel from "../../../pages/campaign/components/CampaignCharactersPanel";

describe("CampaignCharactersPanel", () => {
  it("renders assigned characters list", () => {
    render(
      <CampaignCharactersPanel
        campaignCharacters={[{ characterId: 1, characterName: "Hero", systemCode: "dnd5e", ownerDisplayName: "GM" }]}
        myCharacters={[]}
        campaignSystemCode="dnd5e"
        canManage={false}
        busy={false}
        onAssign={() => {}}
        onDetach={() => {}}
      />
    );

    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText(/Wlasciciel:/)).toBeInTheDocument();
  });

  it("shows only compatible characters in assign select", () => {
    render(
      <CampaignCharactersPanel
        campaignCharacters={[]}
        myCharacters={[
          { id: 1, name: "Dnd Hero", systemCode: "dnd5e" },
          { id: 2, name: "CoC Investigator", systemCode: "coc7e" },
        ]}
        campaignSystemCode="dnd5e"
        canManage
        busy={false}
        onAssign={() => {}}
        onDetach={() => {}}
      />
    );

    expect(screen.getByRole("option", { name: "Dnd Hero (dnd5e)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "CoC Investigator (coc7e)" })).not.toBeInTheDocument();
  });

  it("shows empty state when user has no compatible characters", () => {
    render(
      <CampaignCharactersPanel
        campaignCharacters={[]}
        myCharacters={[{ id: 2, name: "CoC Investigator", systemCode: "coc7e" }]}
        campaignSystemCode="dnd5e"
        canManage
        busy={false}
        onAssign={() => {}}
        onDetach={() => {}}
      />
    );

    expect(screen.getByText("Brak postaci zgodnych z systemem tej kampanii.")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "CoC Investigator (coc7e)" })).not.toBeInTheDocument();
  });
});
