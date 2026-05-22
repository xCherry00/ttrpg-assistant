import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FriendsPage from "../../pages/FriendsPage";
import * as socialApi from "../../api/social";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../api/social", () => ({
  getSocialOverview: vi.fn(),
  getFriendSuggestions: vi.fn(),
  discoverUsers: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  rejectFriendRequest: vi.fn(),
  cancelFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <FriendsPage />
    </MemoryRouter>,
  );
}

describe("FriendsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socialApi.getSocialOverview.mockResolvedValue({
      friends: [],
      incomingRequests: [],
      outgoingRequests: [],
      blockedUsers: [],
    });
    socialApi.getFriendSuggestions.mockResolvedValue([
      {
        id: 22,
        handle: "jan-1234",
        username: "jan",
        tagCode: 1234,
        displayName: "Jan",
        bio: "",
        favoriteSystem: "dnd5e",
        role: "USER",
        isMg: false,
        activityLabel: "aktywny dzisiaj",
        relationship: "NONE",
        sharedCampaignsCount: 1,
        suggestionReason: "Wspolna kampania",
        mutualFriendsCount: 0,
      },
    ]);
    socialApi.discoverUsers.mockResolvedValue([]);
    socialApi.sendFriendRequest.mockResolvedValue(undefined);
  });

  it("renders Proponowane tab label", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Proponowane" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Odkrywaj" })).not.toBeInTheDocument();
  });

  it("shows suggestion reason and sends invite", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Proponowane" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Proponowane" }));

    await waitFor(() => {
      expect(screen.getByText(/Powod: Wspolna kampania/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Dodaj znajomego" }));

    await waitFor(() => {
      expect(socialApi.sendFriendRequest).toHaveBeenCalledWith("test-token", 22);
    });
  });
});
