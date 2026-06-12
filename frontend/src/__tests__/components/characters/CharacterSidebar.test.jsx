import { fireEvent, render, screen } from "@testing-library/react";
import CharacterSidebar from "../../../components/characters/CharacterSidebar";

describe("CharacterSidebar", () => {
  it("renders character row and triggers selection", () => {
    const onSelect = vi.fn();
    render(
      <CharacterSidebar
        items={[{ id: 7, name: "Lyra", systemCode: "dnd5e", raceName: "Elf", className: "Wizard", level: 3 }]}
        loading={false}
        selectedId={7}
        onSelect={onSelect}
        onCreate={vi.fn()}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /Lyra/i });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(7);
    expect(screen.getByRole("button", { name: "+ Nowa postać" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importuj JSON" })).toBeInTheDocument();
  });
});
