import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import InitiativePage from "../../../pages/initiative/InitiativePage";
import * as initiativeApi from "../../../api/initiative";

const STORAGE_KEY = "ttrpg.quickInitiativeTracker";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/initiative", () => ({
  searchDndMonsters: vi.fn(),
  getDndMonsterDetails: vi.fn(),
}));

async function addParticipantDnd({ name, initiative = "10", mod = "0", ac = "12", hp = "10", maxHp = "10" }) {
  fireEvent.click(screen.getByRole("button", { name: "Dodaj uczestnika" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Nazwa uczestnika"), { target: { value: name } });
  fireEvent.change(within(dialog).getByLabelText("Modyfikator inicjatywy"), { target: { value: mod } });
  fireEvent.change(within(dialog).getByLabelText("Inicjatywa"), { target: { value: initiative } });
  fireEvent.change(within(dialog).getByLabelText("AC"), { target: { value: ac } });
  fireEvent.change(within(dialog).getByLabelText("HP"), { target: { value: hp } });
  fireEvent.change(within(dialog).getByLabelText("Max HP"), { target: { value: maxHp } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Dodaj do walki" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

async function addParticipantCoc({ name, dex = "60", hp = "11", maxHp = "11" }) {
  fireEvent.click(screen.getByRole("button", { name: "Dodaj uczestnika" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Nazwa uczestnika"), { target: { value: name } });
  fireEvent.change(within(dialog).getByLabelText("ZR / DEX"), { target: { value: dex } });
  fireEvent.change(within(dialog).getByLabelText("HP"), { target: { value: hp } });
  fireEvent.change(within(dialog).getByLabelText("Max HP"), { target: { value: maxHp } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Dodaj do walki" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

describe("InitiativePage v0.8.3 quick tracker", () => {
  beforeEach(() => {
    window.localStorage.clear();
    initiativeApi.searchDndMonsters.mockResolvedValue([]);
    initiativeApi.getDndMonsterDetails.mockResolvedValue(null);
  });

  it("defaults to D&D mode", () => {
    render(<InitiativePage />);
    expect(screen.getByLabelText("System trackera")).toHaveValue("dnd5e");
    expect(screen.getByRole("button", { name: "Losuj inicjatywe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sortuj po inicjatywie" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sortuj po ZR" })).not.toBeInTheDocument();
  });

  it("does not render Marker and Stany columns", async () => {
    render(<InitiativePage />);
    await addParticipantDnd({ name: "Kolumny", initiative: "11", ac: "13" });
    expect(screen.queryByRole("columnheader", { name: "Marker" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Stany" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Typ / marker" })).toBeInTheDocument();
  });

  it("does not render D&D Monster badge", async () => {
    initiativeApi.searchDndMonsters.mockResolvedValue([{ index: "goblin", name: "Goblin", url: "/api/2014/monsters/goblin" }]);
    initiativeApi.getDndMonsterDetails.mockResolvedValue({
      index: "goblin",
      name: "Goblin",
      armorClass: 15,
      hitPoints: 7,
      dexterity: 14,
      initiativeModifier: 2,
    });

    render(<InitiativePage />);
    fireEvent.click(screen.getByRole("button", { name: "Dodaj uczestnika" }));
    await waitFor(() => expect(initiativeApi.searchDndMonsters).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Pula potworow"), { target: { value: "goblin" } });
    await waitFor(() => expect(initiativeApi.getDndMonsterDetails).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Dodaj do walki" }));
    await waitFor(() => expect(screen.getByText("Goblin")).toBeInTheDocument());
    expect(screen.queryByText("D&D Monster")).not.toBeInTheDocument();
  });

  it("shows only final initiative number in D&D table", async () => {
    render(<InitiativePage />);
    await addParticipantDnd({ name: "Rogue", initiative: "12", mod: "2", ac: "17" });
    const row = screen.getByRole("row", { name: /Rogue/i });
    expect(within(row).getByText("12")).toBeInTheDocument();
    expect(within(row).queryByText(/\(mod/i)).not.toBeInTheDocument();
    expect(within(row).queryByText(/mod \+/i)).not.toBeInTheDocument();
  });

  it("switches to CoC and shows ZR/DEX instead of Inicjatywa", async () => {
    render(<InitiativePage />);
    fireEvent.change(screen.getByLabelText("System trackera"), { target: { value: "coc7e" } });
    expect(screen.queryByRole("button", { name: "Losuj inicjatywe" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sortuj po ZR" })).toBeInTheDocument();
    await addParticipantCoc({ name: "Badacz", dex: "65" });
    expect(screen.getByRole("columnheader", { name: "ZR / DEX" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Inicjatywa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "AC" })).not.toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
  });

  it("sorts correctly in D&D mode by initiative", async () => {
    render(<InitiativePage />);
    await addParticipantDnd({ name: "Low", initiative: "8" });
    await addParticipantDnd({ name: "High", initiative: "17" });
    fireEvent.click(screen.getByRole("button", { name: "Sortuj po inicjatywie" }));
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("High");
    expect(rows[2]).toHaveTextContent("Low");
  });

  it("sorts correctly in CoC mode by ZR/DEX", async () => {
    render(<InitiativePage />);
    fireEvent.change(screen.getByLabelText("System trackera"), { target: { value: "coc7e" } });
    await addParticipantCoc({ name: "Slow", dex: "40" });
    await addParticipantCoc({ name: "Fast", dex: "80" });
    fireEvent.click(screen.getByRole("button", { name: "Sortuj po ZR" }));
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Fast");
    expect(rows[2]).toHaveTextContent("Slow");
  });

  it("persists state in localStorage including systemCode", async () => {
    render(<InitiativePage />);
    fireEvent.change(screen.getByLabelText("System trackera"), { target: { value: "coc7e" } });
    await addParticipantCoc({ name: "Persisted", dex: "55" });
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    expect(parsed.systemCode).toBe("coc7e");
    expect(parsed.participants[0].name).toBe("Persisted");
  });

  it("migrates legacy storage without systemCode to D&D", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      participants: [{ id: "x", name: "Legacy", type: "NPC", initiative: 11, ac: 10, hp: 10, maxHp: 10 }],
      started: false,
      round: 1,
      orderCounter: 2,
      initiativeRolled: false,
    }));
    render(<InitiativePage />);
    expect(screen.getByLabelText("System trackera")).toHaveValue("dnd5e");
  });
});
