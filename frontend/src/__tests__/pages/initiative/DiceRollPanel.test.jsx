import { fireEvent, render, screen } from "@testing-library/react";
import DiceRollPanel from "../../../pages/initiative/components/DiceRollPanel";

describe("DiceRollPanel", () => {
  it("renders roll list and submits form", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    const onFormChange = vi.fn();
    render(
      <DiceRollPanel
        rollTypes={["GENERIC"]}
        form={{ rollExpression: "1d20", rollLabel: "", rollType: "GENERIC" }}
        onFormChange={onFormChange}
        onSubmit={onSubmit}
        disabled={false}
        diceLoading={false}
        diceRolls={[{ id: 1, rollExpression: "1d20", total: 15, rollLabel: "Atk", rollType: "GENERIC", rolledByUsername: "u", createdAt: new Date().toISOString() }]}
        diceError=""
        selectedEncounterId=""
      />
    );
    expect(screen.getByText("[Atk] 1d20 = 15")).toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: "Rzuc" }).closest("form"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
