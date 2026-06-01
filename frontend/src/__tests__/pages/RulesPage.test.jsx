import { fireEvent, render, screen } from "@testing-library/react";
import RulesPage from "../../pages/RulesPage";

describe("RulesPage simplified documentation layout", () => {
  beforeEach(() => {
    window.sessionStorage.removeItem("rulesSelectedSystem");
  });

  it("renders system selector and two-panel rules content", () => {
    render(<RulesPage />);

    expect(screen.getByLabelText("Szukaj systemu")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Og/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Og/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Legalne zrodla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Czym jest ten system/i })).toBeInTheDocument();
    expect(screen.queryByText(/Status danych:/i)).not.toBeInTheDocument();
  });

  it("filters systems and switches selected rules profile", () => {
    render(<RulesPage />);

    fireEvent.change(screen.getByLabelText("Szukaj systemu"), { target: { value: "Mork" } });
    expect(screen.getByRole("option", { name: "Mork Borg" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "D&D 5e" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Mork Borg" }));

    expect(screen.getByRole("heading", { name: "Mork Borg" })).toBeInTheDocument();
    expect(screen.getByText("MORK BORG Bare Bones Edition")).toBeInTheDocument();
  });

  it("opens accordion sections without rendering the old right rail", () => {
    render(<RulesPage />);

    fireEvent.click(screen.getByRole("option", { name: "D&D 5e" }));
    fireEvent.click(screen.getByRole("button", { name: "Walka w skrocie" }));

    expect(screen.getByText(/Walka dziala w rundach/i)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Tematy zasad" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Oficjalne materialy startowe")).not.toBeInTheDocument();
  });
});
