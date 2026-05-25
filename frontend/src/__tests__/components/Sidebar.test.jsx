import { render, screen, within } from "@testing-library/react";
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
});
