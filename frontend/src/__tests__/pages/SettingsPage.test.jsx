import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "../../pages/SettingsPage";
import * as settingsApi from "../../api/settings";

const logoutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", logout: logoutMock }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../api/settings", () => ({
  getMyProfile: vi.fn(),
  updateEmail: vi.fn(),
  changePassword: vi.fn(),
  updateChatNickColor: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("../../api/auth", () => ({
  logout: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage v0.8.1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsApi.getMyProfile.mockResolvedValue({ email: "tester@example.com", chatNickColor: "#1f765f" });
    settingsApi.updateChatNickColor.mockResolvedValue({ chatNickColor: "#1f765f" });
    settingsApi.deleteAccount.mockResolvedValue({ ok: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders header and left categories", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Ustawienia" })).toBeInTheDocument();
    expect(screen.getByText("Zarządzaj kontem, bezpieczeństwem i wyglądem aplikacji.")).toBeInTheDocument();

    const categoriesPanel = screen.getByRole("heading", { name: "Kategorie" }).closest("aside");
    expect(within(categoriesPanel).getByRole("button", { name: /Konto/i })).toBeInTheDocument();
    expect(within(categoriesPanel).getByRole("button", { name: /Bezpieczeństwo/i })).toBeInTheDocument();
    expect(within(categoriesPanel).getByRole("button", { name: /Wygląd/i })).toBeInTheDocument();
    expect(within(categoriesPanel).getByRole("button", { name: /Chat sesji/i })).toBeInTheDocument();
    expect(within(categoriesPanel).getByRole("button", { name: /Dane lokalne/i })).toBeInTheDocument();
    expect(within(categoriesPanel).getByRole("button", { name: /Strefa ryzyka/i })).toBeInTheDocument();
  });

  it("does not render right rail helper panels", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Konto" });

    expect(screen.queryByText(/Szybki dostep/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Status$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Panel MG/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Profil użytkownika/i)).not.toBeInTheDocument();
  });

  it("shows expected sections and keeps nickname color in chat section", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Konto" });

    const categoriesPanel = screen.getByRole("heading", { name: "Kategorie" }).closest("aside");
    fireEvent.click(within(categoriesPanel).getByRole("button", { name: /Bezpieczeństwo/i }));
    expect(await screen.findByRole("heading", { name: "Bezpieczeństwo" })).toBeInTheDocument();

    fireEvent.click(within(categoriesPanel).getByRole("button", { name: /Wygląd/i }));
    expect(await screen.findByRole("heading", { name: "Wygląd" })).toBeInTheDocument();
    expect(screen.getByText("Ciemny")).toBeInTheDocument();
    expect(screen.getByText("Jasny")).toBeInTheDocument();

    fireEvent.click(within(categoriesPanel).getByRole("button", { name: /Chat sesji/i }));
    expect(await screen.findByRole("heading", { name: "Chat sesji" })).toBeInTheDocument();
    expect(screen.getByText(/Przykladowa wiadomosc na czacie sesji/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zapisz" })).toBeInTheDocument();

    fireEvent.click(within(categoriesPanel).getByRole("button", { name: /Dane lokalne/i }));
    expect(await screen.findByRole("heading", { name: "Dane lokalne" })).toBeInTheDocument();
    expect(screen.getByText(/Nie usuwa konta, kampanii ani postaci/i)).toBeInTheDocument();

    fireEvent.click(within(categoriesPanel).getByRole("button", { name: /Strefa ryzyka/i }));
    expect(await screen.findByRole("heading", { name: "Strefa ryzyka" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Usuń konto/i })).toBeInTheDocument();
  });

  it("requires confirmation for local data clear and account delete", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Konto" });

    const categoriesPanel = screen.getByRole("heading", { name: "Kategorie" }).closest("aside");
    fireEvent.click(within(categoriesPanel).getByRole("button", { name: /Dane lokalne/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Wyczyść cache aplikacji/i }));

    expect(window.confirm).toHaveBeenCalled();

    fireEvent.click(within(categoriesPanel).getByRole("button", { name: /Strefa ryzyka/i }));
    fireEvent.change(await screen.findByPlaceholderText(/Podaj haslo/i), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /Usuń konto/i }));

    await waitFor(() => {
      expect(settingsApi.deleteAccount).toHaveBeenCalledWith("test-token", "secret123");
    });
  });

  it("does not render TODO/demo/placeholder markers", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Konto" });

    expect(screen.queryByText(/TODO|coming soon|demo|placeholder|mock|not implemented/i)).not.toBeInTheDocument();
  });
});
