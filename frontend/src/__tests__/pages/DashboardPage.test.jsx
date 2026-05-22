import { render, screen, waitFor, within } from "@testing-library/react";
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
    window.localStorage.clear();
    meApi.getMe.mockResolvedValue({ id: 1, displayName: "Tester" });
    charactersApi.listCharacters.mockResolvedValue([{ id: 10, name: "Aria" }]);
  });

  it("renders target KPI set and removes Materialy/Szybkie akcje", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 1, title: "Planowana", status: "PLANNED", scheduledFor: "2026-06-19T18:00:00Z" },
      { id: 2, title: "Zakonczona", status: "FINISHED", scheduledFor: "2026-06-10T18:00:00Z" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Kampanie")).toBeInTheDocument();
    });

    const kpiSection = screen.getByLabelText("Podsumowanie");
    const kpi = within(kpiSection);
    expect(kpi.getByText("Postacie")).toBeInTheDocument();
    expect(kpi.getByText("Nadchodzące sesje")).toBeInTheDocument();
    expect(kpi.getByText("Sesje")).toBeInTheDocument();
    expect(screen.queryByText("Materiały")).not.toBeInTheDocument();
    expect(screen.queryByText("Szybkie akcje")).not.toBeInTheDocument();
  });

  it("active session hero shows only IN_PROGRESS and proper CTA labels", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 101, title: "Sesja Aktywna", status: "IN_PROGRESS", scheduledFor: "2026-06-18T18:00:00Z" },
      { id: 102, title: "Sesja Planowana", status: "PLANNED", scheduledFor: "2026-06-20T18:00:00Z" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Sesja Aktywna")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Dołącz do sesji/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Otwórz kampanię/i })).toBeInTheDocument();
    expect(screen.queryByText("Brak aktywnej sesji")).not.toBeInTheDocument();
  });

  it("shows neutral hero state when IN_PROGRESS is missing", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 900, title: "Zakonczylo sie", status: "FINISHED", scheduledFor: "2026-06-10T18:00:00Z" },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Brak aktywnej sesji")).toBeInTheDocument();
    });

    expect(screen.getByText("Nie prowadzisz teraz żadnej sesji na żywo.")).toBeInTheDocument();
  });

  it("upcoming panel shows only PLANNED sessions and max 3", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Kampania A" }]);
    campaignsApi.listCampaignSessions.mockResolvedValue([
      { id: 1, title: "S1", status: "PLANNED", scheduledFor: "2026-06-18T18:00:00Z" },
      { id: 2, title: "S2", status: "PLANNED", scheduledFor: "2026-06-19T18:00:00Z" },
      { id: 3, title: "S3", status: "PLANNED", scheduledFor: "2026-06-20T18:00:00Z" },
      { id: 4, title: "S4", status: "PLANNED", scheduledFor: "2026-06-21T18:00:00Z" },
      { id: 5, title: "S-IN", status: "IN_PROGRESS", scheduledFor: "2026-06-17T18:00:00Z" },
      { id: 6, title: "S-FIN", status: "FINISHED", scheduledFor: "2026-06-16T18:00:00Z" },
    ]);

    renderPage();

    const panelHeading = await screen.findByRole("heading", { name: "Nadchodzące sesje" });
    const panel = panelHeading.closest("article");
    expect(panel).toBeTruthy();

    const scoped = within(panel);
    expect(scoped.getByText("S1")).toBeInTheDocument();
    expect(scoped.getByText("S2")).toBeInTheDocument();
    expect(scoped.getByText("S3")).toBeInTheDocument();
    expect(scoped.queryByText("S4")).not.toBeInTheDocument();
    expect(scoped.queryByText("S-IN")).not.toBeInTheDocument();
    expect(scoped.queryByText("S-FIN")).not.toBeInTheDocument();
  });

  it("renders neutral Zalegle notatki panel", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Zaległe notatki")).toBeInTheDocument();
    });

    expect(screen.getByText("Notatki sesyjne pojawią się tutaj po wdrożeniu archiwum sesji.")).toBeInTheDocument();
  });

  it("shows empty state for recently generated when history is missing", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Brak ostatnio wygenerowanych treści")).toBeInTheDocument();
    });
  });

  it("shows recently generated items from localStorage history", async () => {
    window.localStorage.setItem("ttrpg.generatorHistory", JSON.stringify([
      {
        id: "g-1",
        generatorCode: "npc",
        label: "Generator NPC",
        createdAt: "2026-05-22T10:00:00.000Z",
        result: { title: "Kupiec z sekretami", summary: "Wie duzo o porcie." },
      },
    ]));
    campaignsApi.listCampaigns.mockResolvedValue([]);
    campaignsApi.listCampaignSessions.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Kupiec z sekretami")).toBeInTheDocument();
    });
    expect(screen.getByText(/Generator NPC/i)).toBeInTheDocument();
  });
});
