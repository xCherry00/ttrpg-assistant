import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpcomingSessionPanel from "../../../pages/campaign/components/UpcomingSessionPanel";
import * as campaignsApi from "../../../api/campaigns";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/campaigns", () => ({
  getSessionAttendance: vi.fn(),
  updateMySessionAttendance: vi.fn(),
}));

describe("UpcomingSessionPanel attendance", () => {
  beforeEach(() => {
    campaignsApi.getSessionAttendance.mockReset();
    campaignsApi.updateMySessionAttendance.mockReset();
  });

  it("shows empty state when there is no upcoming session", () => {
    render(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Brak zaplanowanej ani aktywnej sesji.")).toBeInTheDocument();
  });

  it("shows only one nearest planned session for owner", async () => {
    campaignsApi.getSessionAttendance.mockResolvedValue({
      availableCount: 0,
      maybeCount: 0,
      unavailableCount: 0,
      noResponseCount: 0,
      responses: [],
    });
    render(
      <MemoryRouter>
        <UpcomingSessionPanel
          campaignId={10}
          isOwner
          sessions={[
            { id: 6, title: "Pozniejsza", status: "PLANNED", scheduledFor: "2026-06-20T18:00:00Z" },
            { id: 5, title: "Najblizsza", status: "PLANNED", scheduledFor: "2026-06-10T18:00:00Z" },
            { id: 4, title: "Archiwalna", status: "FINISHED", scheduledFor: "2026-06-01T18:00:00Z" },
          ]}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Najblizsza")).toBeInTheDocument();
      expect(screen.queryByText("Pozniejsza")).not.toBeInTheDocument();
    });
  });

  it("shows attendance controls for upcoming session", async () => {
    campaignsApi.getSessionAttendance.mockResolvedValue({
      availableCount: 1,
      maybeCount: 2,
      unavailableCount: 0,
      noResponseCount: 3,
      responses: [],
    });
    render(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} isOwner />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bede" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Moze" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Nie bede" })).toBeInTheDocument();
      expect(screen.getByText("available: 1")).toBeInTheDocument();
      expect(screen.getByText("no response: 3")).toBeInTheDocument();
    });
  });

  it("shows attendance loading state", async () => {
    campaignsApi.getSessionAttendance.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} isOwner />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ladowanie frekwencji...")).toBeInTheDocument();
  });

  it("shows attendance error state when fetch fails", async () => {
    campaignsApi.getSessionAttendance.mockRejectedValue(new Error("attendance boom"));
    render(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} isOwner />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("attendance boom")).toBeInTheDocument();
    });
  });

  it("clicking available sends updateMySessionAttendance", async () => {
    campaignsApi.getSessionAttendance.mockResolvedValue({
      availableCount: 0,
      maybeCount: 0,
      unavailableCount: 0,
      noResponseCount: 4,
      responses: [],
    });
    campaignsApi.updateMySessionAttendance.mockResolvedValue({
      availableCount: 1,
      maybeCount: 0,
      unavailableCount: 0,
      noResponseCount: 3,
      responses: [{ self: true, status: "AVAILABLE" }],
    });
    render(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} isOwner />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Bede" }));
    await waitFor(() => {
      expect(campaignsApi.updateMySessionAttendance).toHaveBeenCalledWith(
        "test-token",
        10,
        5,
        expect.objectContaining({ status: "AVAILABLE" }),
      );
      expect(screen.getByText("available: 1")).toBeInTheDocument();
    });
  });

  it("shows start for owner when planned and no enter-live for member", async () => {
    campaignsApi.getSessionAttendance.mockResolvedValue({
      availableCount: 0,
      maybeCount: 0,
      unavailableCount: 0,
      noResponseCount: 1,
      responses: [],
    });
    const onStart = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} isOwner onStart={onStart} />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("button", { name: "Rozpocznij sesje" })).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} isOwner={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "Dolacz do aktywnej sesji" })).not.toBeInTheDocument();
  });

  it("shows enter-live and finish for owner when in progress", async () => {
    campaignsApi.getSessionAttendance.mockResolvedValue({
      availableCount: 0,
      maybeCount: 0,
      unavailableCount: 0,
      noResponseCount: 1,
      responses: [],
    });
    const onFinish = vi.fn();
    render(
      <MemoryRouter>
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "IN_PROGRESS" }]} isOwner onFinish={onFinish} />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("link", { name: "Dolacz do aktywnej sesji" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zakoncz sesje" })).toBeInTheDocument();
  });
});
