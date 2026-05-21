import { fireEvent, render, screen } from "@testing-library/react";
import CharacterSidebar from "../../../components/characters/CharacterSidebar";

describe("CharacterSidebar", () => {
  it("renders PDF button in list and triggers callback", () => {
    const onDownloadPdf = vi.fn();
    render(
      <CharacterSidebar
        items={[{ id: 7, name: "Lyra", systemCode: "dnd5e", raceName: "Elf", className: "Wizard", level: 3 }]}
        loading={false}
        selectedId={7}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDownloadPdf={onDownloadPdf}
      />,
    );

    const button = screen.getByRole("button", { name: /Pobierz PDF/i });
    fireEvent.click(button);
    expect(onDownloadPdf).toHaveBeenCalledWith(7);
  });
});
