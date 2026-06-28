import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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
  default: ({ systemCode, onCreateDnd, onCreateCoc }) => (
    <div>
      <span>creator-{systemCode}</span>
      <button type="button" onClick={() => onCreateDnd?.({ name: "Dnd Hero" })}>submit-dnd</button>
      <button type="button" onClick={() => onCreateCoc?.({ name: "Coc Hero" })}>submit-coc</button>
    </div>
  ),
}));

vi.mock("../../components/characters/CharacterSystemSelector", () => ({
  default: ({ onSelect }) => (
    <div>
      <button type="button" onClick={() => onSelect("dnd5e")}>wybierz-dnd</button>
      <button type="button" onClick={() => onSelect("coc7e")}>wybierz-coc</button>
    </div>
  ),
}));

describe("CharactersPage", () => {
  function renderPage(initialEntry = "/characters/1") {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/characters/:characterId" element={<CharactersPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    charactersApi.listCharacters.mockResolvedValue([{ id: 1, name: "Hero", systemCode: "dnd5e", raceName: "Human", className: "Fighter", level: 1 }]);
    charactersApi.getCharacter.mockResolvedValue({ id: 1, name: "Hero", systemCode: "dnd5e", sheetJson: {} });
    charactersApi.exportCharacter.mockResolvedValue({ exportVersion: "v1", character: { name: "Hero", systemCode: "dnd5e", sheetJson: {} } });
    charactersApi.importCharacter.mockResolvedValue({ characterId: 2 });
    charactersApi.quickCreateCharacter.mockResolvedValue({ id: 10 });
    charactersApi.quickCreateCocCharacter.mockResolvedValue({ id: 11 });
    charactersApi.updateCharacterSheet.mockResolvedValue({ id: 1, name: "After Save", systemCode: "dnd5e", sheetJson: {} });
    charactersApi.deleteCharacter.mockResolvedValue({});
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("renders sidebar actions without print or backend PDF button", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: "Eksportuj JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importuj JSON" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drukuj" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /PDF/i })).not.toBeInTheDocument();
  });

  it("exports and imports JSON", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Eksportuj JSON" }));
    await waitFor(() => expect(charactersApi.exportCharacter).toHaveBeenCalledWith("test-token", 1));

    const input = document.querySelector('input[type="file"]');
    const file = new File([JSON.stringify({ exportVersion: "v1", character: { name: "X", systemCode: "dnd5e", sheetJson: {} } })], "char.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(charactersApi.importCharacter).toHaveBeenCalled());
  });

  it("creates D&D character and CoC character", async () => {
    renderPage("/characters");

    fireEvent.click((await screen.findAllByRole("button", { name: /Nowa postać/i }))[0]);
    fireEvent.click(screen.getByRole("button", { name: "wybierz-dnd" }));
    fireEvent.click(screen.getByRole("button", { name: "submit-dnd" }));
    await waitFor(() => expect(charactersApi.quickCreateCharacter).toHaveBeenCalled());

    fireEvent.click((await screen.findAllByRole("button", { name: /Nowa postać/i }))[0]);
    fireEvent.click(await screen.findByRole("button", { name: "wybierz-coc" }));
    fireEvent.click(screen.getByRole("button", { name: "submit-coc" }));
    await waitFor(() => expect(charactersApi.quickCreateCocCharacter).toHaveBeenCalled());
  });

  it("supports save and delete flow", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Zapisz zmiany" }));
    await waitFor(() => expect(charactersApi.updateCharacterSheet).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Usuń postać" }));
    fireEvent.click(screen.getByRole("button", { name: "Potwierdz usuniecie" }));
    await waitFor(() => expect(charactersApi.deleteCharacter).toHaveBeenCalledWith("test-token", 1));
  });

  it("does not render legacy coming soon / MVP markers", async () => {
    renderPage();
    await screen.findByRole("button", { name: "Eksportuj JSON" });
    expect(screen.queryByText(/coming soon|wkrotce|demo|mvp/i)).not.toBeInTheDocument();
  });

  it("read-only preview hides editing actions", async () => {
    renderPage("/characters/1?mode=preview");
    await screen.findByText(/tryb tylko do odczytu/i);
    expect(screen.queryByRole("button", { name: "Usuń postać" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zapisz zmiany" })).not.toBeInTheDocument();
  });
});
