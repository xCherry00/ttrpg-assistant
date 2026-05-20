import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CampaignSessionsPanel from "../../../pages/campaign/components/CampaignSessionsPanel";

describe("CampaignSessionsPanel", () => {
  it("renders sessions with statuses", () => {
    render(
      <MemoryRouter>
        <CampaignSessionsPanel
          campaignId="10"
          sessions={[{ id: 2, title: "S1", status: "PLANNED", description: "x" }, { id: 3, title: "S2", status: "IN_PROGRESS", description: "y" }]}
          isOwner={false}
          busy={false}
          onCreate={() => {}}
          onStart={() => {}}
          onFinish={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("S1")).toBeInTheDocument();
    expect(screen.getByText("PLANNED")).toBeInTheDocument();
    expect(screen.getByText("IN_PROGRESS")).toBeInTheDocument();
  });
});
