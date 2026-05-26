import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RulesPage from "../../pages/RulesPage";

describe("RulesPage v0.8.2", () => {
  beforeEach(() => {
    window.sessionStorage.removeItem("rulesSelectedSystem");
  });

  it("renders Ogólne zasady RPG category and Rzuty kośćmi section", async () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Ogólne zasady RPG" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Ogólne zasady RPG" })).toBeInTheDocument();
      expect(screen.getByText(/systemy RPG/i)).toBeInTheDocument();
      expect(screen.getByText(/Kości pomagają rozstrzygać niepewne sytuacje|Kosci pomagaja rozstrzygac niepewne sytuacje/i)).toBeInTheDocument();
    });
  });

  it("renders Black Monk starter source for Call of Cthulhu", async () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("button", { name: "Call of Cthulhu 7e" }));

    expect(await screen.findByText("Zew Cthulhu Starter (PL)")).toBeInTheDocument();
  });

  it("does not render dominant technical local summary text", async () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("button", { name: "D&D 5e" }));

    expect(await screen.findByRole("heading", { name: "D&D 5e" })).toBeInTheDocument();
    expect(screen.queryByText(/Status danych:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ten system ma w aplikacji tylko podstawowy skrot zasad/i)).not.toBeInTheDocument();
  });
});
