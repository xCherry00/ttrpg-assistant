import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountMenu from "../../components/AccountMenu";
import * as settingsApi from "../../api/settings";

const logoutMock = vi.fn();

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", logout: logoutMock }),
}));

vi.mock("../../api/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("../../api/settings", () => ({
  getMyProfile: vi.fn(),
}));

describe("AccountMenu cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsApi.getMyProfile.mockResolvedValue({
      email: "tester@example.com",
      displayName: "Tester",
      role: "PLAYER",
      isMg: true,
    });
  });

  it("does not render community section and shows separate role badges", async () => {
    render(
      <MemoryRouter>
        <AccountMenu />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Uzytkownik/i }));

    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Spolecznosc/i)).not.toBeInTheDocument();
    expect(screen.getByText("Gracz")).toBeInTheDocument();
    expect(screen.getByText("MG")).toBeInTheDocument();
    expect(screen.queryByText(/Gracz \+ MG/i)).not.toBeInTheDocument();
  });
});
