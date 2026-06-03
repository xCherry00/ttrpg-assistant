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

    fireEvent.click(screen.getByRole("tab", { name: "Fate / Fudge" }));

    expect(screen.getByText(/Liczba ko.ci Fate/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Genesys / Narrative" }));

    expect(screen.getAllByText("Zdolność").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Trudność").length).toBeGreaterThan(0);
  });

  it("does not show Genesys symbol legend in the result panel", () => {
    const { container } = render(<DicePage />);

    fireEvent.click(screen.getByRole("tab", { name: "Genesys / Narrative" }));

    expect(container.querySelector(".diceGenesysLegend")).not.toBeInTheDocument();
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
