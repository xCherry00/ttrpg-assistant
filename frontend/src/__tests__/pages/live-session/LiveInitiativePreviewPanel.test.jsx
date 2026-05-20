import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LiveInitiativePreviewPanel from "../../../pages/live-session/components/LiveInitiativePreviewPanel";

function renderPanel(props = {}) {
  const baseProps = {
    campaignId: "10",
    sessionStatus: "IN_PROGRESS",
    isOwner: false,
    liveState: { activeEncounterId: null },
    encounter: null,
    encounters: [],
    onSelectActiveEncounter: undefined,
    loading: false,
  };
  render(
    <MemoryRouter>
      <LiveInitiativePreviewPanel {...baseProps} {...props} />
    </MemoryRouter>
  );
}

describe("LiveInitiativePreviewPanel", () => {
  it("PLANNED shows locked state", () => {
    renderPanel({ sessionStatus: "PLANNED" });
    expect(screen.getByText(/bedzie dostepny po rozpoczeciu sesji/i)).toBeInTheDocument();
  });

  it("shows empty state when there is no active encounter", () => {
    renderPanel({ sessionStatus: "IN_PROGRESS", liveState: { activeEncounterId: null } });
    expect(screen.getByText("Brak aktywnego starcia dla tej sesji.")).toBeInTheDocument();
  });

  it("owner sees guidance to choose encounter when encounters exist", () => {
    renderPanel({
      isOwner: true,
      sessionStatus: "IN_PROGRESS",
      liveState: { activeEncounterId: null },
      encounters: [{ id: 5, name: "Ambush" }],
      onSelectActiveEncounter: vi.fn(),
    });
    expect(screen.getByText(/Wybierz encounter z listy powyzej/)).toBeInTheDocument();
  });

  it("member sees limited current and next preview", () => {
    renderPanel({
      isOwner: false,
      liveState: { activeEncounterId: 3 },
      encounter: {
        id: 3,
        name: "Fight",
        roundNumber: 2,
        currentParticipantId: 2,
        participants: [
          { id: 1, name: "Goblin", participantType: "MONSTER", sortOrder: 1, currentHp: 6, maxHp: 12 },
          { id: 2, name: "Ela", participantType: "PLAYER_CHARACTER", sortOrder: 0, currentHp: 9, maxHp: 10 },
          { id: 3, name: "Wolf", participantType: "MONSTER", sortOrder: 2, currentHp: 3, maxHp: 8 },
        ],
      },
    });

    expect(screen.getByText("Ela")).toBeInTheDocument();
    expect(screen.getByText("Aktualna tura")).toBeInTheDocument();
    expect(screen.queryByText(/HP:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Conditions:/)).not.toBeInTheDocument();
  });

  it("owner sees full queue details including HP and conditions", () => {
    renderPanel({
      isOwner: true,
      liveState: { activeEncounterId: 3 },
      encounter: {
        id: 3,
        name: "Fight",
        status: "ACTIVE",
        roundNumber: 2,
        currentParticipantId: 2,
        participants: [
          { id: 2, name: "Ela", participantType: "PLAYER_CHARACTER", sortOrder: 0, initiativeValue: 15, initiativeModifier: 3, currentHp: 9, maxHp: 10, tempHp: 0, conditions: "Bless", isDefeated: false },
        ],
      },
    });
    expect(screen.getByText(/Encounter:/)).toBeInTheDocument();
    expect(screen.getByText(/HP: 9\/10/)).toBeInTheDocument();
    expect(screen.getByText(/Conditions: Bless/)).toBeInTheDocument();
  });

  it("FINISHED shows read-only ended state", () => {
    renderPanel({ sessionStatus: "FINISHED" });
    expect(screen.getByText(/Sesja zakonczona/i)).toBeInTheDocument();
  });

  it("owner can change active encounter from selector", () => {
    const onSelect = vi.fn();
    renderPanel({
      isOwner: true,
      sessionStatus: "IN_PROGRESS",
      liveState: { activeEncounterId: 7 },
      encounters: [{ id: 7, name: "Ambush" }, { id: 8, name: "Rooftop" }],
      onSelectActiveEncounter: onSelect,
    });
    fireEvent.change(screen.getByDisplayValue("Ambush"), { target: { value: "8" } });
    expect(onSelect).toHaveBeenCalledWith(8);
  });
});
