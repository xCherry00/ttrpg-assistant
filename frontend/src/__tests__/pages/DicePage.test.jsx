import { fireEvent, render, screen } from "@testing-library/react";
import DicePage from "../../pages/DicePage";

describe("DicePage", () => {
  it("renders standard roll type controls", () => {
    render(<DicePage />);

    expect(screen.getByRole("button", { name: "Advantage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disadvantage" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Przewaga" })).not.toBeInTheDocument();
  });

  it("switches roll modes without losing the workspace", () => {
    render(<DicePage />);

    const modeSelect = screen.getByRole("combobox", { name: /tryb/i });
    fireEvent.change(modeSelect, { target: { value: "fate" } });

    expect(screen.getByText(/Liczba ko.ci Fate/i)).toBeInTheDocument();

    fireEvent.change(modeSelect, { target: { value: "genesys" } });

    expect(screen.getAllByText("Ability").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Difficulty").length).toBeGreaterThan(0);
  });

  it("roll mechanic still works after layout refresh", () => {
    const { container } = render(<DicePage />);

    fireEvent.click(screen.getByRole("button", { name: /Rzu/i }));

    const finalValue = container.querySelector(".diceBigNumber");
    expect(finalValue).toBeTruthy();
    expect(finalValue.textContent).not.toBe("-");
    expect(screen.getByText(/Historia rzut/i)).toBeInTheDocument();
  });
});
