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
  downloadCharacterSheetPdf: vi.fn(),
}));

vi.mock("../../components/characters/CharacterCreatorRouter", () => ({ default: () => null }));
vi.mock("../../components/characters/CharacterSystemSelector", () => ({ default: () => null }));
vi.mock("../../components/characters/CharacterSheetRouter", () => ({
  default: ({ detail }) => <div data-testid="sheet-router">{detail?.name}</div>,
}));
vi.mock("../../components/characters/CharacterSidebar", () => ({
  default: ({ items, selectedId, onSelect }) => (
    <div>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-testid={`char-${item.id}`}
          aria-pressed={selectedId === item.id}
          onClick={() => onSelect(item.id)}
        >
          {item.name}
        </button>
      ))}
    </div>
  ),
}));

describe("CharactersPage PDF export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    charactersApi.listCharacters.mockResolvedValue([{ id: 10, name: "Aldric", systemCode: "dnd5e" }]);
    charactersApi.getCharacter.mockResolvedValue({ id: 10, name: "Aldric", systemCode: "dnd5e" });
    charactersApi.downloadCharacterSheetPdf.mockResolvedValue(undefined);
  });

  it("shows PDF download button for loaded character and calls helper on click", async () => {
    render(<CharactersPage />);

    const button = await screen.findByRole("button", { name: /Pobierz karte PDF/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(charactersApi.downloadCharacterSheetPdf).toHaveBeenCalledWith("test-token", 10);
    });
  });

  it("shows readable error notice when PDF download fails", async () => {
    charactersApi.downloadCharacterSheetPdf.mockRejectedValue(new Error("Nie udalo sie pobrac PDF."));
    render(<CharactersPage />);

    const button = await screen.findByRole("button", { name: /Pobierz karte PDF/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText("Nie udalo sie pobrac PDF.").length).toBeGreaterThan(0);
    });
  });

  it("does not render PDF button when no character detail is loaded", async () => {
    charactersApi.listCharacters.mockResolvedValue([]);
    charactersApi.getCharacter.mockResolvedValue(null);
    render(<CharactersPage />);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Pobierz karte PDF/i })).not.toBeInTheDocument();
    });
  });
});
