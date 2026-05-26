import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", logout: vi.fn() }),
}));

vi.mock("../../api/auth", () => ({
  logout: vi.fn(),
}));

describe("Sidebar navigation cleanup", () => {
  it("shows Dashboard outside gameplay section and gameplay contains only campaigns/characters", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    const allDashboard = screen.getAllByRole("link", { name: "Dashboard" });
    expect(allDashboard.length).toBe(1);

    const gameplaySection = screen.getByRole("button", { name: /Rozgrywka/i }).closest("section");
    const gameplayLinks = within(gameplaySection).getAllByRole("link");

    expect(gameplayLinks.map((link) => link.textContent)).toEqual(["Kampanie", "Postacie"]);
    expect(within(gameplaySection).queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("allows gameplay section to collapse on dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    const gameplayToggle = screen.getByRole("button", { name: /Rozgrywka/i });
    expect(gameplayToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(gameplayToggle);

    expect(gameplayToggle).toHaveAttribute("aria-expanded", "false");
    const gameplaySection = gameplayToggle.closest("section");
    expect(within(gameplaySection).queryByRole("link", { name: "Kampanie" })).not.toBeInTheDocument();
  });
});
