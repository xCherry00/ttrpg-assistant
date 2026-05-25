import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CharactersPage from "../../pages/CharactersPage";
import * as charactersApi from "../../api/characters";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../api/characters", () => ({
  listCharacters: vi.fn(),
  getCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  quickCreateCharacter: vi.fn(),
  quickCreateCocCharacter: vi.fn(),
  updateCharacterSheet: vi.fn(),
  exportCharacter: vi.fn(),
  importCharacter: vi.fn(),
}));

vi.mock("../../components/characters/CharacterCreatorRouter", () => ({
  default: () => <div>creator</div>,
}));
vi.mock("../../components/characters/CharacterSheetRouter", () => ({
  default: () => <div>sheet</div>,
}));
vi.mock("../../components/characters/CharacterSystemSelector", () => ({
  default: () => <div>system-selector</div>,
}));

describe("CharactersPage import/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    charactersApi.listCharacters.mockResolvedValue([{ id: 1, name: "Hero", systemCode: "dnd5e", raceName: "Human", className: "Fighter", level: 1 }]);
    charactersApi.getCharacter.mockResolvedValue({ id: 1, name: "Hero", systemCode: "dnd5e", sheetJson: {} });
    charactersApi.exportCharacter.mockResolvedValue({ exportVersion: "v1", character: { name: "Hero", systemCode: "dnd5e", sheetJson: {} } });
    charactersApi.importCharacter.mockResolvedValue({ characterId: 2 });
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("renders export and import buttons", async () => {
    render(<CharactersPage />);
    expect(await screen.findByRole("button", { name: "Eksportuj JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importuj JSON" })).toBeInTheDocument();
  });

  it("export calls API", async () => {
    render(<CharactersPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Eksportuj JSON" }));
    await waitFor(() => {
      expect(charactersApi.exportCharacter).toHaveBeenCalledWith("test-token", 1);
    });
  });

  it("import valid json calls API and refreshes list", async () => {
    render(<CharactersPage />);
    await screen.findByRole("button", { name: "Importuj JSON" });
    const input = document.querySelector('input[type="file"]');
    const file = new File(
      [JSON.stringify({ exportVersion: "v1", character: { name: "X", systemCode: "dnd5e", sheetJson: {} } })],
      "char.json",
      { type: "application/json" },
    );
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(charactersApi.importCharacter).toHaveBeenCalled();
      expect(charactersApi.listCharacters).toHaveBeenCalledTimes(2);
    });
  });

  it("shows import error message", async () => {
    charactersApi.importCharacter.mockRejectedValue(new Error("Import fail"));
    render(<CharactersPage />);
    await screen.findByRole("button", { name: "Importuj JSON" });
    const input = document.querySelector('input[type="file"]');
    const file = new File([JSON.stringify({})], "bad.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });
    const errors = await screen.findAllByText("Import fail");
    expect(errors.length).toBeGreaterThan(0);
  });
});
