import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../../pages/DashboardPage";
import * as meApi from "../../api/me";
import * as campaignsApi from "../../api/campaigns";
import * as charactersApi from "../../api/characters";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", logout: vi.fn() }),
}));

vi.mock("../../api/me", () => ({
  getMe: vi.fn(),
}));

vi.mock("../../api/campaigns", () => ({
  listCampaigns: vi.fn(),
  listCampaignSessions: vi.fn(),
  listCampaignMaterials: vi.fn(),
}));

vi.mock("../../api/characters", () => ({
  listCharacters: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meApi.getMe.mockResolvedValue({ id: 1, displayName: "Tester" });
    charactersApi.listCharacters.mockResolvedValue([{ id: 10, name: "Aria" }]);
    campaignsApi.listCampaignMaterials.mockResolvedValue([]);
  });

  it("renders real upcoming sessions, active session and keeps quick actions valid", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([
      { id: 1, title: "Kampania A" },
      { id: 2, title: "Kampania B" },
    ]);
    campaignsApi.listCampaignSessions.mockImplementation((_token, campaignId) => {
      if (campaignId === 1) {
        return Promise.resolve([
          { id: 101, title: "Sesja A", status: "PLANNED", scheduledFor: "2026-06-20T18:00:00Z" },
          { id: 102, title: "Sesja B", status: "IN_PROGRESS", scheduledFor: "2026-06-18T18:00:00Z" },
        ]);
      }
      return Promise.resolve([
        { id: 201, title: "Sesja C", status: "PLANNED", scheduledFor: "2026-06-19T18:00:00Z" },
      ]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Sesja A")).toBeInTheDocument();
    });

    expect(screen.getByText("Sesja C")).toBeInTheDocument();
    expect(screen.getByText("Dołącz do aktywnej sesji")).toBeInTheDocument();
    expect(screen.queryByText("Rozpocznij walkę")).not.toBeInTheDocument();
    expect(screen.queryByText("Brak aktywnej walki")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Rzuć kośćmi/i })).toHaveAttribute("href", "/dice");
    expect(screen.getByRole("link", { name: /Dodaj notatkę/i })).toHaveAttribute("href", "/campaigns");
  });

  it("shows neutral state when there is no in-progress and no planned sessions", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 900, title: "Zakończona", status: "DONE", scheduledFor: "2026-06-10T18:00:00Z" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Brak aktywnej sesji")).toBeInTheDocument();
    });

    expect(screen.getByText("Brak zaplanowanych sesji")).toBeInTheDocument();
  });
});
