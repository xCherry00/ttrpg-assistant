import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CampaignDetailPage from "../../../pages/campaign/CampaignDetailPage";
import * as campaignsApi from "../../../api/campaigns";
import * as charactersApi from "../../../api/characters";
import * as sessionNotesApi from "../../../api/sessionNotes";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/campaigns", () => ({
  getCampaignById: vi.fn(),
  getCampaignCharacters: vi.fn(),
  listCampaignMembers: vi.fn(),
  listCampaignSessions: vi.fn(),
  listCampaignMaterials: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  assignCharacterToCampaign: vi.fn(),
  detachCharacterFromCampaign: vi.fn(),
  createCampaignSession: vi.fn(),
  startCampaignSession: vi.fn(),
  finishCampaignSession: vi.fn(),
  getSessionAttendance: vi.fn(),
  updateMySessionAttendance: vi.fn(),
  getCampaignPlayerNotes: vi.fn(),
  createCampaignPlayerNote: vi.fn(),
  updateCampaignPlayerNote: vi.fn(),
  deleteCampaignPlayerNote: vi.fn(),
}));

vi.mock("../../../api/sessionNotes", () => ({
  getMySessionNote: vi.fn(),
  saveMySessionNote: vi.fn(),
  deleteMySessionNote: vi.fn(),
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
  campaignsApi.listCampaignMaterials.mockResolvedValue([]);
  campaignsApi.getCampaignPlayerNotes.mockResolvedValue([]);
  campaignsApi.getSessionAttendance.mockResolvedValue({ responses: [], availableCount: 0, maybeCount: 0, unavailableCount: 0, noResponseCount: 0 });
  charactersApi.listCharacters.mockResolvedValue([]);
  sessionNotesApi.getMySessionNote.mockResolvedValue(null);
  sessionNotesApi.saveMySessionNote.mockResolvedValue({});
  sessionNotesApi.deleteMySessionNote.mockResolvedValue({});
}

describe("CampaignDetailPage dashboard by role", () => {
  beforeEach(() => {
    Object.values(campaignsApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
    Object.values(sessionNotesApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
    charactersApi.listCharacters.mockReset();
    baseMocks();
  });

  it("MG sees GM dashboard with session creation", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: true, status: "active", systemCode: "dnd5e", joinCode: "ABC123" });
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 2, title: "Live S", status: "IN_PROGRESS", description: "test" }]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("MG Dashboard")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Sesje kampanii" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Utworz sesje" })).toBeInTheDocument();
      expect(screen.getByText("Kod zaproszenia")).toBeInTheDocument();
    });
  });

  it("player sees player dashboard and no session creation", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: false, status: "active", systemCode: "dnd5e" });
    campaignsApi.listCampaignMembers.mockResolvedValue([{ id: 22, self: true, owner: false, mg: false, displayName: "P1", username: "p1" }]);
    campaignsApi.getCampaignCharacters.mockResolvedValue([{ characterId: 9, characterName: "Rogue", systemCode: "dnd5e", userId: 22 }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 7, title: "Fin", status: "FINISHED", description: "done", finishedAt: "2026-05-20T12:00:00Z" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Player Dashboard")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Moja postac" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Uczestnicy" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Utworz sesje" })).not.toBeInTheDocument();
    });
  });

  it("does not render placeholder section anymore", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: true, status: "active", systemCode: "dnd5e" });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("MG Dashboard")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Frekwencja / Glosowanie" })).not.toBeInTheDocument();
    });
  });

  it("shows session notes action for finished sessions", async () => {
    campaignsApi.getCampaignById.mockResolvedValue({ id: 10, title: "A", owner: false, status: "active", systemCode: "dnd5e" });
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 7, title: "Fin", status: "FINISHED", description: "done", finishedAt: "2026-05-20T12:00:00Z" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Moje notatki" })).toBeInTheDocument();
    });
  });
});
