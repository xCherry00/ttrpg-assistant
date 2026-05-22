import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LiveSessionPage from "../../../pages/live-session/LiveSessionPage";
import * as campaignsApi from "../../../api/campaigns";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/campaigns", () => ({
  getCampaignById: vi.fn(),
  listCampaignSessions: vi.fn(),
  getCampaignCharacters: vi.fn(),
  getCampaignDiceRolls: vi.fn(),
  getSessionLiveState: vi.fn(),
  startCampaignSession: vi.fn(),
  finishCampaignSession: vi.fn(),
  createRequestedRoll: vi.fn(),
  getRequestedRolls: vi.fn(),
  fulfillRequestedRoll: vi.fn(),
  cancelRequestedRoll: vi.fn(),
  updateSessionLiveState: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/campaigns/10/sessions/2/live"]}>
      <Routes>
        <Route path="/campaigns/:campaignId/sessions/:sessionId/live" element={<LiveSessionPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LiveSessionPage", () => {
  beforeEach(() => {
    Object.values(campaignsApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
  });

  it("shows loading state", () => {
    campaignsApi.getCampaignById.mockReturnValue(new Promise(() => {}));
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([]);
    renderPage();
    expect(screen.getByText("Ladowanie live session...")).toBeInTheDocument();
  });

  it("loads owner view without initiative preview panel", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: true });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([
      { characterId: 100, characterName: "Ela", systemCode: "dnd5e", ownerUsername: "ela_user" },
    ]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([{ id: 1, expression: "1d20+5", total: 17, rollType: "SKILL" }]);
    campaignsApi.getSessionLiveState.mockResolvedValue({
      sceneTitle: "Ruiny",
      sceneImageUrl: "https://img.example/scene.webp",
      sceneDescription: "Mgla i deszcz.",
      activeEncounterId: 7,
    });
    campaignsApi.getRequestedRolls.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Dragonfall" })).toBeInTheDocument();
      expect(screen.getByText("Scene Panel")).toBeInTheDocument();
      expect(screen.getByText("Requested Rolls")).toBeInTheDocument();
      expect(screen.queryByText("Initiative Preview")).not.toBeInTheDocument();
      expect(screen.queryByText(/Encounter:/)).not.toBeInTheDocument();
    });
  });

  it("player can execute requested roll", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([
      { id: 22, rollLabel: "Perception", status: "PENDING", dcVisible: false, rollExpression: "1d20", characterName: "Ela" },
    ]);
    campaignsApi.fulfillRequestedRoll.mockResolvedValue({});

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Wykonaj rzut/i }));

    await waitFor(() => {
      expect(campaignsApi.fulfillRequestedRoll).toHaveBeenCalledWith("test-token", "10", "2", 22, {});
    });
  });

  it("does not render hidden DC for player", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([
      { id: 30, rollLabel: "Stealth", status: "PENDING", dcVisible: false, dc: 18, rollExpression: "1d20", characterName: "Ela" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText("DC: 18")).not.toBeInTheDocument();
      expect(screen.queryByText("Initiative Preview")).not.toBeInTheDocument();
    });
  });
});
