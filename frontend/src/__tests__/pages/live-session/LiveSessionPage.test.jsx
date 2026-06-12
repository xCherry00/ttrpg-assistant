import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LiveSessionPage from "../../../pages/live-session/LiveSessionPage";
import * as campaignsApi from "../../../api/campaigns";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/campaigns", () => ({
  finishCampaignSession: vi.fn(),
  getCampaignById: vi.fn(),
  getCampaignCharacters: vi.fn(),
  getSessionAttendance: vi.fn(),
  getSessionLiveState: vi.fn(),
  listCampaignMembers: vi.fn(),
  listCampaignSessions: vi.fn(),
  startCampaignSession: vi.fn(),
  updateSessionLiveState: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/campaigns/10/sessions/2/live"]}>
      <Routes>
        <Route path="/campaigns/:campaignId/sessions/:sessionId/live" element={<LiveSessionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function seedDefaults({ owner = false, status = "IN_PROGRESS" } = {}) {
  campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner, systemCode: "dnd5e" });
  campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status }]);
  campaignsApi.getCampaignCharacters.mockResolvedValue([]);
  campaignsApi.listCampaignMembers.mockResolvedValue([{ id: 33, self: true, owner: false, mg: false, username: "ela" }]);
  campaignsApi.getSessionAttendance.mockResolvedValue({ responses: [] });
  campaignsApi.getSessionLiveState.mockResolvedValue({ sceneTitle: "Ruiny", sceneImageUrl: "", sceneDescription: "Mgla" });
}

describe("LiveSessionPage", () => {
  beforeEach(() => {
    Object.values(campaignsApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
    seedDefaults();
  });

  it("renders the live scene workspace without requested-roll controls", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /Panel sceny/i })).toBeInTheDocument();
    expect(screen.queryByText(/Wymagane rzuty/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zadaj rzut/i)).not.toBeInTheDocument();
  });

  it("lets GM add a scene", async () => {
    seedDefaults({ owner: true });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Dodaj scen/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dodaj scen/i })).toBeInTheDocument();
  });

  it("blocks a player from entering a planned session", async () => {
    seedDefaults({ status: "PLANNED" });
    renderPage();

    expect(await screen.findByText(/Sesja nie zosta/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kampanii/i })).toBeInTheDocument();
  });

  it("shows character picker for player with assigned characters", async () => {
    campaignsApi.getCampaignCharacters.mockResolvedValue([
      { characterId: 100, characterName: "Ela", userId: 33, level: 4, systemCode: "dnd5e", portraitUrl: "https://img.test/ela.png" },
    ]);
    renderPage();

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getAllByText("Ela").length).toBeGreaterThan(0);
  });
});
