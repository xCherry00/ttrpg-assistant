import { fireEvent, render, screen } from "@testing-library/react";
import CharacterSystemSelector from "../../../components/characters/CharacterSystemSelector";

describe("CharacterSystemSelector", () => {
  it("shows only active systems and no coming soon texts", () => {
    const onSelect = vi.fn();
    render(<CharacterSystemSelector onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: /D&D 5e/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zew Cthulhu 7e/i })).toBeInTheDocument();
    expect(screen.queryByText(/wkrotce|coming soon|demo|mvp/i)).not.toBeInTheDocument();
  });

  it("calls onSelect for chosen system", () => {
    const onSelect = vi.fn();
    render(<CharacterSystemSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /D&D 5e/i }));
    expect(onSelect).toHaveBeenCalledWith("dnd5e");
  });
});
