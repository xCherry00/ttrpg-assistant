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
  getSessionAttendance: vi.fn(),
  listCampaignMembers: vi.fn(),
  listCampaigns: vi.fn(),
  listCampaignSessions: vi.fn(),
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

describe("DashboardPage workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    meApi.getMe.mockResolvedValue({ id: 1, displayName: "Tester" });
    campaignsApi.getSessionAttendance.mockResolvedValue({ responses: [] });
    campaignsApi.listCampaignMembers.mockResolvedValue([]);
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
    expect(screen.getByRole("link", { name: /Dolacz do sesji/i })).toBeInTheDocument();
  });

  it("shows nearest planned session when active is missing", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: false, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 11, title: "Sesja Pozniej", status: "PLANNED", scheduledFor: "2030-06-20T18:00:00Z" },
      { id: 12, title: "Sesja Najblizsza", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect((await screen.findAllByText("Sesja Najblizsza")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Najblizsza sesja/i).length).toBeGreaterThan(0);
  });

  it("shows empty hero state when there is no active or planned session", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: false, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 13, title: "Sesja stara", status: "FINISHED", scheduledFor: "2025-06-19T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Nie masz jeszcze zaplanowanej sesji")).toBeInTheDocument();
    expect(screen.getByText(/Przydaloby sie to zmienic/i)).toBeInTheDocument();
    expect(screen.getByAltText("Placeholder banera sesji")).toHaveAttribute("src", "/assets/placeholder/Baner.png");
  });

  it("renders practical dashboard sections", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A", owner: true, systemCode: "dnd5e" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 21, title: "Planowana", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" },
      { id: 22, title: "Zakonczona", status: "FINISHED", scheduledFor: "2029-06-19T18:00:00Z" },
    ]);
    charactersApi.listCharacters.mockResolvedValue([{ id: 100, name: "Aria", systemCode: "dnd5e" }]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Ostatnie kampanie" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nadchodzace sesje" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ostatnia aktywnosc" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rola w kampaniach" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Obecnosc graczy" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Notatka MG" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Kampania A/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Planowana").length).toBeGreaterThan(0);
  });

  it("renders campaign role donut from real campaigns", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([
      { id: 1, title: "A", owner: true, systemCode: "dnd5e" },
      { id: 2, title: "B", owner: false, systemCode: "coc7e" },
      { id: 3, title: "C", owner: false, systemCode: "dnd5e" },
    ]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    const panel = (await screen.findByRole("heading", { name: "Rola w kampaniach" })).closest("article");
    const rolePanel = within(panel);
    expect(rolePanel.getByRole("img", { name: /Diagram kampanii wedlug roli/i })).toBeInTheDocument();
    expect(rolePanel.getByText("Prowadzisz jako GM: 1")).toBeInTheDocument();
    expect(rolePanel.getByText("Grasz jako gracz: 2")).toBeInTheDocument();
  });

  it("renders availability panel with campaign tabs", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([
      { id: 1, title: "A", owner: true, systemCode: "dnd5e" },
      { id: 2, title: "B", owner: false, systemCode: "coc7e" },
    ]);
    campaignsApi.listCampaignSessions
      .mockResolvedValueOnce([{ id: 88, title: "Glosowanie A", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" }])
      .mockResolvedValueOnce([{ id: 89, title: "Glosowanie B", status: "PLANNED", scheduledFor: "2030-06-20T18:00:00Z" }]);
    campaignsApi.getSessionAttendance.mockResolvedValue({
      responses: [
        { id: 1, userId: 7, displayName: "Ela", status: "AVAILABLE", note: 'AVAILABILITY_WEEK_V1:{"Pn":"available","Wt":"maybe","Śr":"unavailable","Cz":"none","Pt":"available","Sb":"maybe","Nd":"none"}' },
      ],
    });
    campaignsApi.listCampaignMembers.mockResolvedValue([{ id: 7, displayName: "Ela" }]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Obecnosc graczy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "B" })).toBeInTheDocument();
    expect(await screen.findByText("Ela")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nd" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    await waitFor(() => expect(campaignsApi.getSessionAttendance).toHaveBeenCalledWith("test-token", "2", 89));
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
  });

  it("starts availability panel from the campaign with the nearest planned session", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([
      { id: 1, title: "A", owner: true, systemCode: "dnd5e" },
      { id: 2, title: "B", owner: false, systemCode: "coc7e" },
    ]);
    campaignsApi.listCampaignSessions
      .mockResolvedValueOnce([{ id: 88, title: "Pozniejsza A", status: "PLANNED", scheduledFor: "2030-06-20T18:00:00Z" }])
      .mockResolvedValueOnce([{ id: 89, title: "Najblizsza B", status: "PLANNED", scheduledFor: "2030-06-19T18:00:00Z" }]);
    campaignsApi.getSessionAttendance.mockResolvedValue({ responses: [] });
    campaignsApi.listCampaignMembers.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Obecnosc graczy" })).toBeInTheDocument();
    await waitFor(() => expect(campaignsApi.getSessionAttendance).toHaveBeenCalledWith("test-token", "2", 89));
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
  });

  it("does not render removed dashboard concepts", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);
    charactersApi.listCharacters.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Rola w kampaniach" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Systemy RPG" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Szybkie akcje|Zaproszenia|Szybki podglad/i)).not.toBeInTheDocument();
  });
});
