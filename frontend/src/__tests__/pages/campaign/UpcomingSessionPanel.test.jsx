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
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} />
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
        <UpcomingSessionPanel campaignId={10} sessions={[{ id: 5, title: "S", status: "PLANNED" }]} />
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
});
