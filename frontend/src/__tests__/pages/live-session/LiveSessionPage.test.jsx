import { render, screen, waitFor } from "@testing-library/react";
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
    renderPage();
    expect(screen.getByText("Ladowanie live session...")).toBeInTheDocument();
  });

  it("loads and shows owner scene form with live state", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: true });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([
      { characterId: 100, characterName: "Ela", systemCode: "dnd5e", ownerUsername: "ela_user" },
    ]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([{ id: 1, expression: "1d20+5", total: 17, rollType: "SKILL" }]);
    campaignsApi.getSessionLiveState.mockResolvedValue({
      campaignId: 10,
      sessionId: 2,
      sceneTitle: "Ruiny",
      sceneImageUrl: "https://img.example/scene.webp",
      sceneDescription: "Mgla i deszcz.",
      activeEncounterId: null,
      updatedAt: null,
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Dragonfall" })).toBeInTheDocument();
      expect(screen.getByText(/Session Two/)).toBeInTheDocument();
      expect(screen.getByText("Party / Players")).toBeInTheDocument();
      expect(screen.getByText("Ela")).toBeInTheDocument();
      expect(screen.getByText("Scene Panel")).toBeInTheDocument();
      expect(screen.getByText("Requested Rolls")).toBeInTheDocument();
      expect(screen.getByText("Initiative Preview")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save scene" })).toBeInTheDocument();
      expect(screen.getByDisplayValue("Ruiny")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://img.example/scene.webp")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Mgla i deszcz.")).toBeInTheDocument();
    });
  });

  it("shows read-only scene panel for member", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue({
      campaignId: 10,
      sessionId: 2,
      sceneTitle: "Port",
      sceneImageUrl: "https://img.example/port.png",
      sceneDescription: "Wieczorny deszcz.",
      activeEncounterId: null,
      updatedAt: null,
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Port")).toBeInTheDocument();
      expect(screen.getByText("Wieczorny deszcz.")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Port" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Save scene" })).not.toBeInTheDocument();
    });
  });

  it("shows not started state for planned session", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "PLANNED" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Session has not started yet.")).toBeInTheDocument();
    });
  });

  it("shows ended read-only state for finished session", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "FINISHED" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Session ended. Read-only view.")).toBeInTheDocument();
      expect(screen.getAllByText(/only for active session \(IN_PROGRESS\)/).length).toBeGreaterThan(0);
    });
  });
});
