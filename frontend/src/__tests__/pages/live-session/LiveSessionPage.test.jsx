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
  listCampaignMembers: vi.fn(),
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
    </MemoryRouter>,
  );
}

function seedDefaults() {
  campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: false, systemCode: "dnd5e" });
  campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
  campaignsApi.getCampaignCharacters.mockResolvedValue([]);
  campaignsApi.listCampaignMembers.mockResolvedValue([{ id: 33, self: true, owner: false, mg: false, username: "ela" }]);
  campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
  campaignsApi.getSessionLiveState.mockResolvedValue({ sceneTitle: "Ruiny", sceneImageUrl: "", sceneDescription: "Mgla" });
  campaignsApi.getRequestedRolls.mockResolvedValue([]);
}

describe("LiveSessionPage role split", () => {
  beforeEach(() => {
    Object.values(campaignsApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
    seedDefaults();
  });

  it("MG sees scene form and requested roll form", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: true, systemCode: "dnd5e" });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Scene Panel" })).toBeInTheDocument();
      expect(screen.getByLabelText("Tytul sceny")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Utworz requested roll" })).toBeInTheDocument();
    });
  });

  it("player sees read-only scene and no requested roll form", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Aktualna scena" })).toBeInTheDocument();
      expect(screen.queryByLabelText("Tytul sceny")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Utworz requested roll" })).not.toBeInTheDocument();
    });
  });

  it("player sees only own requested rolls", async () => {
    campaignsApi.getCampaignCharacters.mockResolvedValue([
      { characterId: 100, characterName: "Ela", userId: 33, systemCode: "dnd5e" },
    ]);
    campaignsApi.getRequestedRolls.mockResolvedValue([
      { id: 1, rollLabel: "My Roll", status: "PENDING", targetCharacterId: 100, rollExpression: "1d20" },
      { id: 2, rollLabel: "Other Roll", status: "PENDING", targetCharacterId: 999, rollExpression: "1d20" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("My Roll")).toBeInTheDocument();
      expect(screen.queryByText("Other Roll")).not.toBeInTheDocument();
    });
  });

  it("MG sees start/finish actions by status", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "Dragonfall", owner: true, systemCode: "dnd5e" });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "PLANNED" }]);

    renderPage();

    expect(await screen.findByRole("button", { name: "Rozpocznij sesje" })).toBeInTheDocument();

    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "IN_PROGRESS" }]);
    renderPage();

    expect(await screen.findByRole("button", { name: "Zakoncz sesje" })).toBeInTheDocument();
  });

  it("player does not see start/finish actions", async () => {
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "PLANNED" }]);
    renderPage();

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Rozpocznij sesje" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Zakoncz sesje" })).not.toBeInTheDocument();
    });
  });

  it("FINISHED blocks requested roll creation and shows post-session note CTA for player", async () => {
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "FINISHED" }]);
    renderPage();

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Utworz requested roll" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Dodaj notatki po sesji" })).toBeInTheDocument();
    });
  });

  it("does not render initiative preview panel", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/Initiative Preview/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\/initiative/i)).not.toBeInTheDocument();
    });
  });

  it("planned state shows proper message", async () => {
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Session Two", status: "PLANNED" }]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Sesja jest zaplanowana i jeszcze sie nie rozpoczela.")).toBeInTheDocument();
    });
  });

  it("player can execute pending requested roll", async () => {
    campaignsApi.getRequestedRolls.mockResolvedValue([
      { id: 22, rollLabel: "Perception", status: "PENDING", targetUserId: 33, dcVisible: false, rollExpression: "1d20" },
    ]);
    campaignsApi.fulfillRequestedRoll.mockResolvedValue({});

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Wykonaj rzut/i }));

    await waitFor(() => {
      expect(campaignsApi.fulfillRequestedRoll).toHaveBeenCalledWith("test-token", "10", "2", 22, {});
    });
  });
});
