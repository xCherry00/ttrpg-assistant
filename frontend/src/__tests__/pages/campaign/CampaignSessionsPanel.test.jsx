import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CampaignSessionsPanel from "../../../pages/campaign/components/CampaignSessionsPanel";

describe("CampaignSessionsPanel", () => {
  it("renders sessions with statuses", () => {
    render(
      <MemoryRouter>
        <CampaignSessionsPanel
          campaignId="10"
          sessions={[
            { id: 2, title: "S1", status: "PLANNED", description: "x" },
            { id: 3, title: "S2", status: "IN_PROGRESS", description: "y" },
            { id: 4, title: "S3", status: "FINISHED", description: "z" },
          ]}
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
    expect(screen.getByRole("link", { name: "Dolacz do aktywnej sesji" })).toHaveAttribute(
      "href",
      "/campaigns/10/sessions/3/live"
    );
    expect(screen.getByRole("button", { name: /Sesja jeszcze nie rozpocz/ })).toBeDisabled();
    expect(screen.getByText("Sesja zakonczona (archiwalna).")).toBeInTheDocument();
  });

  it("shows owner lifecycle actions for planned and in-progress", () => {
    render(
      <MemoryRouter>
        <CampaignSessionsPanel
          campaignId="10"
          sessions={[
            { id: 2, title: "S1", status: "PLANNED", description: "x" },
            { id: 3, title: "S2", status: "IN_PROGRESS", description: "y" },
          ]}
          isOwner
          busy={false}
          onCreate={() => {}}
          onStart={() => {}}
          onFinish={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
  });
});
