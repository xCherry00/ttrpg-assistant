import { formatHpText, formatParticipantStatus, formatRollSummary } from "./initiativeUtils";

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
});
