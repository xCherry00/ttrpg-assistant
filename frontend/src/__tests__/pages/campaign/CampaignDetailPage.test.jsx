import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignDetailPage from "../../../pages/campaign/CampaignDetailPage";
import * as campaignsApi from "../../../api/campaigns";
import * as charactersApi from "../../../api/characters";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/campaigns", () => ({
  assignCharacterToCampaign: vi.fn(),
  createCampaignSession: vi.fn(),
  deleteCampaign: vi.fn(),
  detachCharacterFromCampaign: vi.fn(),
  finishCampaignSession: vi.fn(),
  getCampaignById: vi.fn(),
  getCampaignCharacters: vi.fn(),
  getSessionAttendance: vi.fn(),
  leaveCampaign: vi.fn(),
  listCampaignMembers: vi.fn(),
  listCampaignSessions: vi.fn(),
  startCampaignSession: vi.fn(),
  updateCampaign: vi.fn(),
  updateMySessionAttendance: vi.fn(),
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
    </MemoryRouter>,
  );
}

function baseMocks() {
  campaignsApi.getCampaignCharacters.mockResolvedValue([]);
  campaignsApi.listCampaignMembers.mockResolvedValue([]);
  campaignsApi.listCampaignSessions.mockResolvedValue([]);
  campaignsApi.getSessionAttendance.mockResolvedValue({ responses: [], availableCount: 0, maybeCount: 0, unavailableCount: 0, noResponseCount: 0 });
  charactersApi.listCharacters.mockResolvedValue([]);
}

describe("CampaignDetailPage dashboard by role", () => {
  beforeEach(() => {
    Object.values(campaignsApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
    charactersApi.listCharacters.mockReset();
    baseMocks();
  });

  it("MG sees campaign workspace without notes/materials tabs", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: true, status: "active", systemCode: "dnd5e", joinCode: "ABC123" });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Live S", status: "IN_PROGRESS", description: "test" }]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Najbliższa sesja" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Zaplanuj ses/i })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /Notatki/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /Materialy|Materiały/i })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: /Gracze/i }));
    expect(await screen.findByRole("heading", { name: "Zaproś gracza do kampanii" })).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("player sees campaign workspace and no session creation", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: false, status: "active", systemCode: "dnd5e" });
    campaignsApi.listCampaignMembers.mockResolvedValue([{ id: 22, self: true, owner: false, mg: false, displayName: "P1", username: "p1" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([{ characterId: 9, characterName: "Rogue", systemCode: "dnd5e", userId: 22 }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 7, title: "Fin", status: "FINISHED", description: "done", finishedAt: "2026-05-20T12:00:00Z" }]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Sesje/i })).toHaveClass("is-active");
      expect(screen.queryByRole("button", { name: /Zaplanuj ses/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: /Notatki/i })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: /Postacie/i }));
    expect(await screen.findByRole("heading", { name: /Postacie kampanii/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Gracze/i }));
    expect(await screen.findByRole("heading", { name: /Gracze kampanii/i })).toBeInTheDocument();
  });

  it("does not render legacy placeholder section anymore", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: true, status: "active", systemCode: "dnd5e" });

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText("MG Dashboard")).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /Frekwencja/i })).not.toBeInTheDocument();
    });
  });

  it("renders campaign character table for player", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: false, status: "active", systemCode: "dnd5e" });
    campaignsApi.listCampaignMembers.mockResolvedValue([{ id: 22, self: true, owner: false, mg: false, displayName: "P1", username: "p1" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([{ characterId: 9, characterName: "Rogue", systemCode: "dnd5e", userId: 22 }]);

    renderPage();

    await screen.findByRole("tab", { name: /Sesje/i });
    fireEvent.click(screen.getByRole("tab", { name: /Postacie/i }));

    expect(await screen.findByRole("table", { name: /Postacie przypisane/i })).toBeInTheDocument();
    expect(screen.getByText("Rogue")).toBeInTheDocument();
  });

  it("renders campaign character table for MG", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: true, status: "active", systemCode: "dnd5e" });
    campaignsApi.getCampaignCharacters.mockResolvedValue([{ characterId: 9, characterName: "Rogue", systemCode: "dnd5e", userId: 22 }]);

    renderPage();

    await screen.findByRole("tab", { name: /Sesje/i });
    fireEvent.click(screen.getByRole("tab", { name: /Postacie/i }));

    expect(await screen.findByRole("table", { name: /Postacie przypisane/i })).toBeInTheDocument();
    expect(screen.getByText("Rogue")).toBeInTheDocument();
  });
});
