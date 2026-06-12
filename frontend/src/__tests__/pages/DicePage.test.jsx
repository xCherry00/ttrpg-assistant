import { fireEvent, render, screen } from "@testing-library/react";
import DicePage from "../../pages/DicePage";

describe("DicePage", () => {
  it("renders standard roll type controls", () => {
    render(<DicePage />);

    expect(screen.getByRole("button", { name: "Advantage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disadvantage" })).toBeInTheDocument();
    ["k4", "k6", "k8", "k10", "k12", "k20", "k100"].forEach((die) => {
      expect(screen.getAllByText(die).length).toBeGreaterThan(0);
    });
    expect(screen.queryByRole("button", { name: "Przewaga" })).not.toBeInTheDocument();
  });

  it("builds a standard dice pool from multiple die controls", () => {
    render(<DicePage />);

    fireEvent.click(screen.getByRole("button", { name: "Zwiększ k4" }));
    fireEvent.click(screen.getByRole("button", { name: "Zwiększ k6" }));

    expect(screen.getAllByText("1k4 + 1k6 + 1k20").length).toBeGreaterThan(0);
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
    expect(screen.queryByText(/Historia rzut/i)).not.toBeInTheDocument();
  });
});
