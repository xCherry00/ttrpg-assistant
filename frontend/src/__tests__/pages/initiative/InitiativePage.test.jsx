import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import InitiativePage from "../../../pages/initiative/InitiativePage";
import * as initiativeApi from "../../../api/initiative";

const STORAGE_KEY = "ttrpg.quickInitiativeTracker";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/initiative", () => ({
  getDndConditions: vi.fn(),
  searchDndMonsters: vi.fn(),
  getDndMonsterDetails: vi.fn(),
}));

async function openCustomModalAndAdd({ name = "Hero", initiative = "15", ac = "16", hp = "20", maxHp = "20", mod = "2" } = {}) {
  fireEvent.click(screen.getByRole("button", { name: "Dodaj uczestnika" }));
  const dialog = screen.getByRole("dialog");
  expect(dialog).toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText("Nazwa uczestnika"), { target: { value: name } });
  fireEvent.change(within(dialog).getByLabelText("Modyfikator inicjatywy"), { target: { value: mod } });
  fireEvent.change(within(dialog).getByLabelText("Inicjatywa"), { target: { value: initiative } });
  fireEvent.change(within(dialog).getByLabelText("AC"), { target: { value: ac } });
  fireEvent.change(within(dialog).getByLabelText("HP"), { target: { value: hp } });
  fireEvent.change(within(dialog).getByLabelText("Max HP"), { target: { value: maxHp } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Dodaj do walki" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

describe("InitiativePage DnD tracker v0.7.6", () => {
  beforeEach(() => {
    window.localStorage.clear();
    initiativeApi.getDndConditions.mockResolvedValue([{ index: "blinded", name: "Blinded", url: "/x" }]);
    initiativeApi.searchDndMonsters.mockResolvedValue([]);
    initiativeApi.getDndMonsterDetails.mockResolvedValue(null);
  });

  it("opens add participant modal", async () => {
    render(<InitiativePage />);
    fireEvent.click(screen.getByRole("button", { name: "Dodaj uczestnika" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Pula potworow")).toBeInTheDocument();
  });

  it("adds custom participant via modal", async () => {
    render(<InitiativePage />);
    await openCustomModalAndAdd({ name: "Rogue", initiative: "17", ac: "15", hp: "14", maxHp: "14", mod: "3" });
    expect(screen.getByText("Rogue")).toBeInTheDocument();
    expect(screen.getByLabelText("HP Rogue")).toHaveValue(14);
    expect(screen.getByText("/ 14")).toBeInTheDocument();
  });

  it("searches monster and adds it with mapped stats", async () => {
    initiativeApi.searchDndMonsters.mockResolvedValue([{ index: "goblin", name: "Goblin", url: "/api/2014/monsters/goblin" }]);
    initiativeApi.getDndMonsterDetails.mockResolvedValue({
      index: "goblin",
      name: "Goblin",
      armorClass: 15,
      hitPoints: 7,
      dexterity: 14,
      initiativeModifier: 2,
      challengeRating: 0.25,
      type: "humanoid",
    });

    render(<InitiativePage />);
    fireEvent.click(screen.getByRole("button", { name: "Dodaj uczestnika" }));
    await waitFor(() => expect(initiativeApi.searchDndMonsters).toHaveBeenCalledWith("test-token", ""));
    fireEvent.change(screen.getByLabelText("Pula potworow"), { target: { value: "goblin" } });
    await waitFor(() => expect(initiativeApi.getDndMonsterDetails).toHaveBeenCalledWith("test-token", "goblin"));
    fireEvent.click(screen.getByRole("button", { name: "Dodaj do walki" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(screen.getByText("Goblin")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByLabelText("HP Goblin")).toHaveValue(7);
    expect(screen.getByText("/ 7")).toBeInTheDocument();
    expect(screen.getByText(/mod \+2/)).toBeInTheDocument();
  });

  it("loads conditions from API and can add condition", async () => {
    initiativeApi.getDndConditions.mockResolvedValue([
      { index: "blinded", name: "Blinded", url: "/x" },
      { index: "stunned", name: "Stunned", url: "/x" },
    ]);
    render(<InitiativePage />);
    await openCustomModalAndAdd({ name: "Hero" });

    const select = screen.getByLabelText("Stan Hero");
    fireEvent.change(select, { target: { value: "Stunned" } });
    fireEvent.click(screen.getByRole("button", { name: "Dodaj stan" }));

    expect(screen.getByRole("button", { name: "Stunned x" })).toBeInTheDocument();
  });

  it("uses fallback conditions when API fails", async () => {
    initiativeApi.getDndConditions.mockRejectedValue(new Error("fail"));
    render(<InitiativePage />);
    await waitFor(() => {
      expect(screen.getByText(/Uzyto listy lokalnej/)).toBeInTheDocument();
    });
  });

  it("rolls initiative as d20 + modifier and locks button", async () => {
    const randomSpy = vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.5);

    render(<InitiativePage />);
    await openCustomModalAndAdd({ name: "A", mod: "2", initiative: "" });
    await openCustomModalAndAdd({ name: "B", mod: "1", initiative: "" });

    fireEvent.click(screen.getByRole("button", { name: "Losuj inicjatywe" }));

    expect(screen.getByText(/Inicjatywa zostala wylosowana/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Losuj inicjatywe" })).toBeDisabled();

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("B");

    randomSpy.mockRestore();
  });

  it("end combat unlocks initiative roll", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<InitiativePage />);
    await openCustomModalAndAdd({ name: "A", mod: "1", initiative: "" });
    fireEvent.click(screen.getByRole("button", { name: "Losuj inicjatywe" }));
    expect(screen.getByRole("button", { name: "Losuj inicjatywe" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Zakoncz walke" }));
    expect(screen.getByRole("button", { name: "Losuj inicjatywe" })).not.toBeDisabled();
    randomSpy.mockRestore();
  });

  it("sorts participants by initiative", async () => {
    render(<InitiativePage />);
    await openCustomModalAndAdd({ name: "Low", initiative: "10", mod: "0" });
    await openCustomModalAndAdd({ name: "High", initiative: "18", mod: "0" });
    fireEvent.click(screen.getByRole("button", { name: "Sortuj po inicjatywie" }));
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("High");
    expect(rows[2]).toHaveTextContent("Low");
  });

  it("moves participant up/down manually", async () => {
    render(<InitiativePage />);
    await openCustomModalAndAdd({ name: "First", initiative: "10" });
    await openCustomModalAndAdd({ name: "Second", initiative: "10" });

    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("First");

    const secondRow = rows[2];
    const firstRow = rows[1];
    fireEvent.dragStart(secondRow);
    fireEvent.dragOver(firstRow);
    fireEvent.drop(firstRow);

    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Second");
  });

  it("updates HP from inline input and auto-defeats on zero", async () => {
    render(<InitiativePage />);
    await openCustomModalAndAdd({ name: "Tank", hp: "20", maxHp: "20" });

    const hpInput = screen.getByLabelText("HP Tank");
    fireEvent.change(hpInput, { target: { value: "15" } });
    expect(screen.getByLabelText("HP Tank")).toHaveValue(15);
    fireEvent.change(hpInput, { target: { value: "0" } });
    expect(screen.getByText("Pokonany")).toBeInTheDocument();
  });

  it("persists new participant fields in localStorage", async () => {
    initiativeApi.searchDndMonsters.mockResolvedValue([{ index: "goblin", name: "Goblin", url: "/api/2014/monsters/goblin" }]);
    initiativeApi.getDndMonsterDetails.mockResolvedValue({
      index: "goblin",
      name: "Goblin",
      armorClass: 15,
      hitPoints: 7,
      dexterity: 14,
      initiativeModifier: 2,
      challengeRating: 0.25,
      type: "humanoid",
    });

    render(<InitiativePage />);
    fireEvent.click(screen.getByRole("button", { name: "Dodaj uczestnika" }));
    await waitFor(() => expect(initiativeApi.searchDndMonsters).toHaveBeenCalledWith("test-token", ""));
    fireEvent.change(screen.getByLabelText("Pula potworow"), { target: { value: "goblin" } });
    await waitFor(() => expect(initiativeApi.getDndMonsterDetails).toHaveBeenCalledWith("test-token", "goblin"));
    fireEvent.click(screen.getByRole("button", { name: "Dodaj do walki" }));

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    expect(parsed.participants[0].sourceType).toBe("DND_MONSTER");
    expect(parsed.participants[0].sourceIndex).toBe("goblin");
    expect(parsed.participants[0].initiativeModifier).toBe(2);
  });
});
