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
  getCampaignEncounters: vi.fn(),
  getEncounter: vi.fn(),
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
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);
    campaignsApi.getEncounter.mockResolvedValue(null);
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
      activeEncounterId: 7,
      updatedAt: null,
    });
    campaignsApi.getRequestedRolls.mockResolvedValue([]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([{ id: 7, name: "Street fight", status: "ACTIVE", participants: [] }]);
    campaignsApi.getEncounter.mockResolvedValue({
      id: 7,
      name: "Street fight",
      status: "ACTIVE",
      roundNumber: 1,
      currentParticipantId: 1,
      participants: [{ id: 1, name: "Ela", participantType: "PLAYER_CHARACTER", sortOrder: 0, currentHp: 9, maxHp: 10 }],
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Dragonfall" })).toBeInTheDocument();
      expect(screen.getByText(/Session Two/)).toBeInTheDocument();
      expect(screen.getByText("Party / Players")).toBeInTheDocument();
      expect(screen.getAllByText("Ela").length).toBeGreaterThan(0);
      expect(screen.getByText("Scene Panel")).toBeInTheDocument();
      expect(screen.getByText("Requested Rolls")).toBeInTheDocument();
      expect(screen.getByText("Initiative Preview")).toBeInTheDocument();
      expect(screen.getByText(/Encounter:/)).toBeInTheDocument();
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
    campaignsApi.getRequestedRolls.mockResolvedValue([
      { id: 1, rollLabel: "Perception", status: "PENDING", dcVisible: false, rollExpression: "1d20", characterName: "Ela" },
    ]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);
    campaignsApi.getEncounter.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Port")).toBeInTheDocument();
      expect(screen.getByText("Wieczorny deszcz.")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Port" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Save scene" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /roll/i })).toBeInTheDocument();
      expect(screen.getByText("Brak aktywnego starcia dla tej sesji.")).toBeInTheDocument();
    });
  });

  it("shows not started state for planned session", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "PLANNED" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);
    campaignsApi.getEncounter.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Session has not started yet.")).toBeInTheDocument();
      expect(screen.getByText(/Podglad inicjatywy bedzie dostepny po rozpoczeciu sesji/)).toBeInTheDocument();
    });
  });

  it("shows ended read-only state for finished session", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "FINISHED" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);
    campaignsApi.getEncounter.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Session ended. Read-only view.")).toBeInTheDocument();
      expect(screen.getByText(/Podglad inicjatywy jest w trybie read-only/)).toBeInTheDocument();
    });
  });

  it("shows GM requested roll form only for in progress", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: true });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);
    campaignsApi.getEncounter.mockResolvedValue(null);
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create requested roll" })).toBeInTheDocument();
    });
  });

  it("player click Roll calls fulfillRequestedRoll", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 90, expression: "1d20+2", total: 14, rollType: "SKILL" }]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([
      { id: 22, rollLabel: "Perception", status: "PENDING", dcVisible: false, rollExpression: "1d20", characterName: "Ela" },
    ]);
    campaignsApi.fulfillRequestedRoll.mockResolvedValue({});
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);
    campaignsApi.getEncounter.mockResolvedValue(null);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /roll/i }));
    await waitFor(() => {
      expect(campaignsApi.fulfillRequestedRoll).toHaveBeenCalledWith("test-token", "10", "2", 22, {});
      expect(campaignsApi.getCampaignDiceRolls).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/1d20\+2 = 14/)).toBeInTheDocument();
    });
  });

  it("does not render hidden DC for player requested roll", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue(null);
    campaignsApi.getRequestedRolls.mockResolvedValue([
      {
        id: 30,
        rollLabel: "Stealth",
        status: "PENDING",
        dcVisible: false,
        dc: 18,
        rollExpression: "1d20",
        characterName: "Ela",
      },
    ]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);
    campaignsApi.getEncounter.mockResolvedValue(null);
    renderPage();

    await waitFor(() => {
      expect(screen.queryByText("DC: 18")).not.toBeInTheDocument();
    });
  });

  it("loads active encounter details when activeEncounterId is set", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
    campaignsApi.getSessionLiveState.mockResolvedValue({ activeEncounterId: 12 });
    campaignsApi.getRequestedRolls.mockResolvedValue([]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([{ id: 12, name: "Bridge" }]);
    campaignsApi.getEncounter.mockResolvedValue({
      id: 12,
      name: "Bridge",
      status: "ACTIVE",
      roundNumber: 3,
      currentParticipantId: 1,
      participants: [{ id: 1, name: "Ela", participantType: "PLAYER_CHARACTER", sortOrder: 0 }],
    });
    renderPage();

    await waitFor(() => {
      expect(campaignsApi.getEncounter).toHaveBeenCalledWith("test-token", "10", 12);
      expect(screen.getByText("Runda: 3")).toBeInTheDocument();
    });
  });
});
