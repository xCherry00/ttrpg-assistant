import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import DicePage from "../../pages/DicePage";

describe("DicePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("locks advantage to two d20 and chooses the higher die instead of summing", () => {
    const randomSpy = vi.spyOn(Math, "random");
    randomSpy.mockReturnValueOnce(0.95).mockReturnValueOnce(0.45);
    const { container } = render(<DicePage />);

    fireEvent.click(screen.getByRole("button", { name: "Advantage" }));

    const numberInputs = container.querySelectorAll('input[type="number"]');
    expect(numberInputs[5]).toHaveValue(2);
    expect(numberInputs[0]).toBeDisabled();
    expect(numberInputs[5]).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Rzu/i }));

    expect(container.querySelector(".diceBigNumber")).toHaveTextContent("20");
    expect(container.querySelector(".diceBreakdown")).toHaveTextContent("odrzucono 10");
  });
});
