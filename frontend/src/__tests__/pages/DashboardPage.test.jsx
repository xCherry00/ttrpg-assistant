import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../../pages/DashboardPage";
import * as meApi from "../../api/me";
import * as campaignsApi from "../../api/campaigns";
import * as charactersApi from "../../api/characters";

const logoutMock = vi.fn();
vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", logout: logoutMock }),
}));

vi.mock("../../api/me", () => ({
  getMe: vi.fn(),
}));

vi.mock("../../api/campaigns", () => ({
  listCampaigns: vi.fn(),
  listCampaignSessions: vi.fn(),
  getSessionAttendance: vi.fn(),
  listCampaignMembers: vi.fn(),
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

describe("DashboardPage v0.8.0.1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    meApi.getMe.mockResolvedValue({ id: 1, displayName: "Tester" });
    campaignsApi.getSessionAttendance.mockResolvedValue({
      availableCount: 2,
      maybeCount: 1,
      unavailableCount: 1,
      noResponseCount: 0,
    });
    campaignsApi.listCampaignMembers.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
  });

  it("shows IN_PROGRESS as active session", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: true, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 10, title: "Sesja Trwa", status: "IN_PROGRESS", scheduledFor: "2026-06-19T18:00:00Z" },
      { id: 11, title: "Sesja Jutro", status: "PLANNED", scheduledFor: "2026-06-20T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Sesja Trwa")).toBeInTheDocument();
    expect(screen.getByText(/Aktywna sesja/i)).toBeInTheDocument();
    expect(screen.getByText("Sesja trwa")).toBeInTheDocument();
  });

  it("shows nearest planned session when active is missing and renders countdown", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: false, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 11, title: "Sesja Pozniej", status: "PLANNED", scheduledFor: "2030-06-20T18:00:00Z" },
      { id: 12, title: "Sesja Najblizsza", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Sesja Najblizsza")).toBeInTheDocument();
    expect(screen.getByText(/Najblizsza sesja/i)).toBeInTheDocument();
    expect(screen.getByText(/Pozostalo:/i)).toBeInTheDocument();
  });

  it("shows empty state when there is no active or planned session", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: false, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 13, title: "Sesja stara", status: "FINISHED", scheduledFor: "2025-06-19T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Brak aktywnej lub zaplanowanej sesji")).toBeInTheDocument();
    expect(screen.getByText("Nie masz obecnie zaplanowanej sesji.")).toBeInTheDocument();
  });

  it("renders expandable tiles and no separate old upcoming panel", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: true, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 21, title: "Planowana", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" },
      { id: 22, title: "Zakonczona", status: "FINISHED", scheduledFor: "2029-06-19T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([{ id: 100, name: "Aria", systemCode: "dnd5e" }]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Kampanie" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Postacie" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nadchodzace sesje" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ostatnie sesje" })).toBeInTheDocument();

    expect(screen.queryByText("Nadchodzące sesje")).not.toBeInTheDocument();

    const campaignsPanel = screen.getByRole("heading", { name: "Kampanie" }).closest("article");
    fireEvent.click(within(campaignsPanel).getByRole("button", { name: "Zwin" }));
    fireEvent.click(within(campaignsPanel).getByRole("button", { name: "Rozwin" }));
    expect((await screen.findAllByText(/Kampania A/i)).length).toBeGreaterThan(0);
  });

  it("upcoming tile shows only PLANNED and recent tile only FINISHED", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: true, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 31, title: "P1", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" },
      { id: 32, title: "I1", status: "IN_PROGRESS", scheduledFor: "2030-06-18T18:00:00Z" },
      { id: 33, title: "F1", status: "FINISHED", scheduledFor: "2029-06-17T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    const upcomingPanel = screen.getByRole("heading", { name: "Nadchodzace sesje" }).closest("article");
    const recentPanel = screen.getByRole("heading", { name: "Ostatnie sesje" }).closest("article");
    fireEvent.click(within(upcomingPanel).getByRole("button", { name: "Rozwin" }));
    fireEvent.click(within(recentPanel).getByRole("button", { name: "Rozwin" }));

    await waitFor(() => {
      expect(within(upcomingPanel).getByText("P1")).toBeInTheDocument();
      expect(within(recentPanel).getByText("F1")).toBeInTheDocument();
    });
    expect(within(upcomingPanel).queryByText("I1")).not.toBeInTheDocument();
    expect(within(recentPanel).queryByText("I1")).not.toBeInTheDocument();
  });

  it("character tile uses real data and shows no fake placeholder records", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([
      { id: 1, name: "Mira", systemCode: "coc7e", occupationName: "Detective" },
    ]);

    renderPage();

    const charactersPanel = screen.getByRole("heading", { name: "Postacie" }).closest("article");
    fireEvent.click(within(charactersPanel).getByRole("button", { name: "Rozwin" }));
    expect(await screen.findByText("Mira")).toBeInTheDocument();
    expect(within(charactersPanel).getByText("COC7E")).toBeInTheDocument();
    expect(screen.queryByText(/Przykladowa kampania|Testowa sesja|Placeholder character/i)).not.toBeInTheDocument();
  });

  it("renders RPG systems panel with campaign and character data", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([
      { id: 1, title: "A", owner: true, systemCode: "dnd5e" },
      { id: 2, title: "B", owner: false, systemCode: "coc7e" },
    ]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([
      { id: 1, name: "Mira", systemCode: "dnd5e" },
      { id: 2, name: "Nox", systemCode: "dnd5e" },
    ]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Systemy RPG" })).toBeInTheDocument();
    const systemsPanel = screen.getByRole("heading", { name: "Systemy RPG" }).closest("article");
    const systems = within(systemsPanel);
    expect(systems.getByText("Kampanie")).toBeInTheDocument();
    expect(systems.getByText("Postacie")).toBeInTheDocument();
    expect(systems.getAllByText("DND5E").length).toBeGreaterThan(0);
  });

  it("renders role panel from real campaigns", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([
      { id: 1, title: "A", owner: true, systemCode: "dnd5e" },
      { id: 2, title: "B", owner: false, systemCode: "coc7e" },
      { id: 3, title: "C", owner: false, systemCode: "dnd5e" },
    ]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Twoja rola" })).toBeInTheDocument();
    expect(screen.getByText("Jako MG: 1")).toBeInTheDocument();
    expect(screen.getByText("Jako gracz: 2")).toBeInTheDocument();
    expect(screen.getByText("Lacznie: 3")).toBeInTheDocument();
  });

  it("does not render recently generated panel", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Twoja rola" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ostatnio wygenerowane" })).not.toBeInTheDocument();
  });

  it("attendance panel renders data or empty state without fake values", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "A", owner: true, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([{ id: 88, title: "Glosowanie", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" }]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Dostepnosc graczy" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Dostepni:/i) ||
      screen.queryByText(/Brak danych o dostepnosci dla najblizszej sesji./i),
    ).toBeTruthy();
    expect(screen.queryByText(/4\/6|67%|fake/i)).not.toBeInTheDocument();
  });
});
