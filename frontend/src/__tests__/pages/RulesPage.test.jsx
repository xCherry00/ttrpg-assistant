import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RulesPage from "../../pages/RulesPage";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

describe("RulesPage v0.7.6.1", () => {
  it("renders exactly five supported systems", async () => {
    render(<RulesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "D&D 5e" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Call of Cthulhu 7e" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Warhammer 4e" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Pathfinder 2e" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mork Borg" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Savage Worlds" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Alien RPG" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("shows D&D basic summary sections, sources and legal note", async () => {
    render(<RulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Podstawowa mechanika testow")).toBeInTheDocument();
      expect(screen.getByText("Walka w skrocie")).toBeInTheDocument();
      expect(screen.getByText("Zdrowie i obrazenia")).toBeInTheDocument();
      expect(screen.getByText("Rozwoj postaci")).toBeInTheDocument();
      expect(screen.getByText("Minimalny flow gry")).toBeInTheDocument();
      expect(screen.getByText("Legalne zrodla:")).toBeInTheDocument();
      expect(screen.getByText(/Skrot oparty o ogolne zasady/)).toBeInTheDocument();
    });

    expect(screen.queryByText("Lokalne wpisy referencyjne")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Szukaj w lokalnych wpisach zasad/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Rzuty koscmi")).not.toBeInTheDocument();
    expect(screen.queryByText("Odpoczynek")).not.toBeInTheDocument();
    expect(screen.queryByText("Atrybuty")).not.toBeInTheDocument();
  });

  it("shows k100 and Sanity for Call of Cthulhu", async () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Call of Cthulhu 7e" }));

    await waitFor(() => {
      expect(screen.getByText(/rzucie k100/i)).toBeInTheDocument();
      expect(screen.getByText(/Sanity/i)).toBeInTheDocument();
    });
  });

  it("shows percentage tests and career for Warhammer", async () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Warhammer 4e" }));

    await waitFor(() => {
      expect(screen.getByText(/testow procentowych/i)).toBeInTheDocument();
      expect(screen.getByText(/kariera/i)).toBeInTheDocument();
    });
  });

  it("shows three actions and four degrees for Pathfinder", async () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Pathfinder 2e" }));

    await waitFor(() => {
      expect(screen.getByText(/trzech akcji/i)).toBeInTheDocument();
      expect(screen.getByText(/cztery stopnie wyniku/i)).toBeInTheDocument();
    });
  });

  it("shows DR and lethality for Mork Borg", async () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Mork Borg" }));

    await waitFor(() => {
      expect(screen.getByText(/trudnosci DR/i)).toBeInTheDocument();
      expect(screen.getByText(/Walka jest smiertelna/i)).toBeInTheDocument();
    });
  });
});
