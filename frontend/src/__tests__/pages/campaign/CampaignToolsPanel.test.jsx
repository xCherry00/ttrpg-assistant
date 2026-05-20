import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CampaignToolsPanel from "../../../pages/campaign/components/CampaignToolsPanel";

describe("CampaignToolsPanel", () => {
  it("shows global tool links", () => {
    render(
      <MemoryRouter>
        <CampaignToolsPanel campaignId="1" activeSession={null} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Otworz global Initiative tool" })).toHaveAttribute("href", "/initiative");
    expect(screen.getByRole("link", { name: "Otworz global Dice tool" })).toHaveAttribute("href", "/dice");
  });
});
