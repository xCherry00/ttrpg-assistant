import { render, screen } from "@testing-library/react";
import CampaignMaterialsPanel from "../../../pages/campaign/components/CampaignMaterialsPanel";

describe("CampaignMaterialsPanel", () => {
  it("shows unavailable state when materials are not available", () => {
    render(<CampaignMaterialsPanel materials={[]} materialsAvailable={false} />);
    expect(screen.getByText("Materiały kampanii są chwilowo niedostępne.")).toBeInTheDocument();
  });

  it("shows empty state when there are no materials", () => {
    render(<CampaignMaterialsPanel materials={[]} materialsAvailable />);
    expect(screen.getByText("Brak materialow.")).toBeInTheDocument();
  });

  it("renders materials list", () => {
    render(
      <CampaignMaterialsPanel
        materials={[
          { id: 1, title: "Mapa", type: "NOTE", content: "Opis", updatedAt: "2026-05-20T10:00:00Z" },
        ]}
        materialsAvailable
      />,
    );
    expect(screen.getByText("Mapa")).toBeInTheDocument();
    expect(screen.getByText("Opis")).toBeInTheDocument();
  });
});
