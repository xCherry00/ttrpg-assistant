export function formatHpText(currentHp, maxHp) {
  const current = currentHp ?? "-";
  const max = maxHp ?? "-";
  return `${current} / ${max}`;
}

export function formatParticipantStatus(participant) {
  if (!participant?.isActive) return "INACTIVE";
  if (participant?.isDefeated) return "DEFEATED";
  return "ACTIVE";
}

export function formatRollSummary(roll) {
  const label = roll?.rollLabel ? `[${roll.rollLabel}] ` : "";
  return `${label}${roll?.rollExpression ?? "-"} = ${roll?.total ?? "-"}`;
}

export function toInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildCustomParticipantPayload(form) {
  return {
    name: (form.name || "").trim(),
    participantType: form.participantType,
    initiativeValue: toInt(form.initiativeValue, 0),
    initiativeModifier: toInt(form.initiativeModifier, 0),
    maxHp: form.maxHp === "" ? null : toInt(form.maxHp, 0),
    currentHp: form.currentHp === "" ? null : toInt(form.currentHp, 0),
  };
}

export function buildCharacterParticipantPayload(form) {
  return {
    characterId: Number(form.characterId),
    initiativeValue: toInt(form.initiativeValue, 0),
    initiativeModifier: toInt(form.initiativeModifier, 0),
    maxHp: form.maxHp === "" ? null : toInt(form.maxHp, 0),
    currentHp: form.currentHp === "" ? null : toInt(form.currentHp, 0),
  };
}

export function buildDiceRollPayload(form, selectedEncounterId) {
  return {
    encounterId: selectedEncounterId ? Number(selectedEncounterId) : null,
    rollExpression: (form.rollExpression || "").trim(),
    rollLabel: form.rollLabel?.trim() || null,
    rollType: form.rollType || "GENERIC",
  };
}
