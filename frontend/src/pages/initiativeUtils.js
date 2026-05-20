export function formatHpText(currentHp, maxHp) {
  const current = currentHp ?? "—";
  const max = maxHp ?? "—";
  return `${current} / ${max}`;
}

export function formatParticipantStatus(participant) {
  if (!participant?.isActive) return "INACTIVE";
  if (participant?.isDefeated) return "DEFEATED";
  return "ACTIVE";
}

export function formatRollSummary(roll) {
  const label = roll?.rollLabel ? `[${roll.rollLabel}] ` : "";
  return `${label}${roll?.rollExpression ?? "—"} = ${roll?.total ?? "—"}`;
}
