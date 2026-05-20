import { render, screen } from "@testing-library/react";
import CampaignOverviewPanel from "../../../pages/campaign/components/CampaignOverviewPanel";

describe("CampaignOverviewPanel", () => {
  it("renders campaign overview data", () => {
    render(
      <CampaignOverviewPanel
        campaign={{ title: "Storm", description: "Desc", status: "active", systemCode: "dnd5e", inviteCode: "ABC" }}
        isOwner
        busy={false}
        onUpdate={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText("Storm")).toBeInTheDocument();
    expect(screen.getByText("ABC")).toBeInTheDocument();
  });
});
