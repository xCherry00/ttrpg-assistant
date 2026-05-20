import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignDetailPage from "../../../pages/campaign/CampaignDetailPage";
import * as campaignsApi from "../../../api/campaigns";
import * as charactersApi from "../../../api/characters";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/campaigns", () => ({
  getCampaignById: vi.fn(),
  getCampaignCharacters: vi.fn(),
  listCampaignSessions: vi.fn(),
  listCampaignMaterials: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  assignCharacterToCampaign: vi.fn(),
  detachCharacterFromCampaign: vi.fn(),
  createCampaignSession: vi.fn(),
  startCampaignSession: vi.fn(),
  finishCampaignSession: vi.fn(),
}));

vi.mock("../../../api/characters", () => ({
  listCharacters: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/campaigns/10"]}>
      <Routes>
        <Route path="/campaigns/:campaignId" element={<CampaignDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CampaignDetailPage smoke", () => {
  beforeEach(() => {
    Object.values(campaignsApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
    charactersApi.listCharacters.mockReset();
  });

  it("renders loading state", () => {
    campaignsApi.getCampaignById.mockReturnValue(new Promise(() => {}));
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    campaignsApi.listCampaignMaterials.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);
    renderPage();
    expect(screen.getByText("Ladowanie workspace kampanii...")).toBeInTheDocument();
  });

  it("renders campaign data", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: true, status: "active", systemCode: "dnd5e" });
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    campaignsApi.listCampaignMaterials.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Campaign Workspace")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "A" })).toBeInTheDocument();
    });
  });

  it("renders error state", async () => {
    campaignsApi.getCampaignById.mockRejectedValue(new Error("boom"));
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    campaignsApi.listCampaignMaterials.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
  });
});
