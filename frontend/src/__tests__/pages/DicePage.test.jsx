import { fireEvent, render, screen } from "@testing-library/react";
import DicePage from "../../pages/DicePage";

describe("DicePage v0.8.2", () => {
  it("renders Ulatwienie instead of Przewaga in roll type selector", () => {
    render(<DicePage />);

    expect(screen.getByRole("option", { name: "Ulatwienie" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Przewaga" })).not.toBeInTheDocument();
  });

  it("roll mechanic still works after copy change", () => {
    const { container } = render(<DicePage />);

    fireEvent.click(screen.getByRole("button", { name: /Rzu/i }));

    const finalValue = container.querySelector(".diceFinalValue");
    expect(finalValue).toBeTruthy();
    expect(finalValue.textContent).not.toBe("—");
  });
});
