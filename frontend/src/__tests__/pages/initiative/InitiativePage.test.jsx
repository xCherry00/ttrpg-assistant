import { render, screen, waitFor } from "@testing-library/react";
import InitiativePage from "../../../pages/initiative/InitiativePage";
import * as campaignsApi from "../../../api/campaigns";

vi.mock("../../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("../../../api/campaigns", () => ({
  listCampaigns: vi.fn(),
  createEncounter: vi.fn(),
  getCampaignEncounters: vi.fn(),
  getCampaignCharacters: vi.fn(),
  getCampaignDiceRolls: vi.fn(),
  addEncounterParticipant: vi.fn(),
  applyParticipantDamage: vi.fn(),
  healParticipant: vi.fn(),
  setParticipantTemporaryHp: vi.fn(),
  setParticipantConditions: vi.fn(),
  defeatParticipant: vi.fn(),
  restoreParticipant: vi.fn(),
  removeEncounterParticipant: vi.fn(),
  nextEncounterTurn: vi.fn(),
  previousEncounterTurn: vi.fn(),
  finishEncounter: vi.fn(),
  deleteEncounter: vi.fn(),
  createDiceRoll: vi.fn(),
}));

describe("InitiativePage smoke", () => {
  beforeEach(() => {
    Object.values(campaignsApi).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
    });
    campaignsApi.getCampaignCharacters.mockResolvedValue([]);
    campaignsApi.getCampaignDiceRolls.mockResolvedValue([]);
  });

  it("renders loading state while campaigns are fetched", () => {
    campaignsApi.listCampaigns.mockReturnValue(new Promise(() => {}));
    render(<InitiativePage />);
    expect(screen.getByText("Ladowanie kampanii...")).toBeInTheDocument();
  });

  it("shows empty state when campaign has no encounters", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Campaign A" }]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([]);

    render(<InitiativePage />);

    await waitFor(() => {
      expect(screen.getByText("Brak encounterow")).toBeInTheDocument();
    });
  });

  it("shows participants when encounter is returned", async () => {
    campaignsApi.listCampaigns.mockResolvedValue([{ id: 1, title: "Campaign A" }]);
    campaignsApi.getCampaignEncounters.mockResolvedValue([
      {
        id: 99,
        name: "Ruins Fight",
        status: "ACTIVE",
        roundNumber: 2,
        currentParticipantId: 501,
        participants: [
          {
            id: 501,
            name: "Hero",
            participantType: "PLAYER_CHARACTER",
            initiativeValue: 15,
            initiativeModifier: 2,
            isActive: true,
            isDefeated: false,
            currentHp: 18,
            maxHp: 20,
            tempHp: 0,
            armorClass: 16,
            conditions: "",
          },
        ],
      },
    ]);

    render(<InitiativePage />);

    await waitFor(() => {
      expect(screen.getByText("Hero")).toBeInTheDocument();
      expect(screen.getByText(/Encounter: Ruins Fight/)).toBeInTheDocument();
    });
  });
});
