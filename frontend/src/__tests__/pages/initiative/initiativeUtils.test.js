import {
  buildCharacterParticipantPayload,
  buildCustomParticipantPayload,
  buildDiceRollPayload,
  formatHpText,
  formatParticipantStatus,
  formatRollSummary,
} from "../../../pages/initiative/initiativeUtils";

describe("initiativeUtils", () => {
  it("formats HP text for participant", () => {
    expect(formatHpText(12, 20)).toBe("12 / 20");
  });

  it("returns defeated status when participant is defeated", () => {
    expect(formatParticipantStatus({ isActive: true, isDefeated: true })).toBe("DEFEATED");
  });

  it("formats roll summary with label/expression/total", () => {
    expect(formatRollSummary({ rollLabel: "Attack", rollExpression: "1d20+5", total: 17 })).toBe("[Attack] 1d20+5 = 17");
  });

  it("builds custom participant payload", () => {
    expect(buildCustomParticipantPayload({
      name: "Goblin",
      participantType: "MONSTER",
      initiativeValue: "11",
      initiativeModifier: "2",
      maxHp: "7",
      currentHp: "6",
    })).toEqual({
      name: "Goblin",
      participantType: "MONSTER",
      initiativeValue: 11,
      initiativeModifier: 2,
      maxHp: 7,
      currentHp: 6,
    });
  });

  it("builds character payload and dice payload", () => {
    expect(buildCharacterParticipantPayload({
      characterId: "22",
      initiativeValue: "9",
      initiativeModifier: "1",
      maxHp: "",
      currentHp: "",
    }).characterId).toBe(22);
    expect(buildDiceRollPayload({ rollExpression: " 1d20+3 ", rollLabel: " atk ", rollType: "SKILL" }, "10"))
      .toEqual({ encounterId: 10, rollExpression: "1d20+3", rollLabel: "atk", rollType: "SKILL" });
  });
});
