import { fireEvent, render, screen } from "@testing-library/react";
import ParticipantsPanel from "../../../pages/initiative/components/ParticipantsPanel";

describe("ParticipantsPanel", () => {
  it("shows participant row and mutation actions", () => {
    const onMutate = vi.fn();
    render(
      <ParticipantsPanel
        participants={[{
          id: 1,
          name: "Hero",
          participantType: "PLAYER_CHARACTER",
          initiativeValue: 12,
          initiativeModifier: 2,
          currentHp: 8,
          maxHp: 10,
          tempHp: 1,
          armorClass: 16,
          conditions: "",
          isActive: true,
          isDefeated: false,
        }]}
        currentParticipantId={1}
        actionBusy=""
        onMutate={onMutate}
        participantTypes={["CUSTOM"]}
        customForm={{ name: "", participantType: "CUSTOM", initiativeValue: 10, initiativeModifier: 0, maxHp: "", currentHp: "" }}
        onCustomFormChange={vi.fn()}
        onSubmitCustom={vi.fn()}
        customDisabled={false}
        campaignCharacters={[]}
        characterForm={{ characterId: "", initiativeValue: 10, initiativeModifier: 0, maxHp: "", currentHp: "" }}
        onCharacterFormChange={vi.fn()}
        onSubmitCharacter={vi.fn()}
        characterDisabled={true}
      />
    );

    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText("8 / 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Defeat" }));
    expect(onMutate).toHaveBeenCalledWith(1, "defeat");
  });
});
