import {
  addEncounterParticipant,
  applyParticipantDamage,
  createDiceRoll,
  createEncounter,
  getSessionLiveState,
  getCampaignDiceRolls,
  getSessionAttendance,
  getCampaignPlayerNotes,
  getCampaignEncounters,
  healParticipant,
  nextEncounterTurn,
  createCampaignPlayerNote,
  createRequestedRoll,
  updateCampaignPlayerNote,
  deleteCampaignPlayerNote,
  cancelRequestedRoll,
  fulfillRequestedRoll,
  getRequestedRolls,
  updateMySessionAttendance,
  updateSessionLiveState,
} from "../../api/campaigns";

describe("campaigns api helpers", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    });
  });

  it("createEncounter sends correct URL/method/auth/body", async () => {
    await createEncounter("token-x", 12, { name: "Fight", systemCode: "dnd5e" });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/campaigns/12/encounters");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer token-x");
    expect(JSON.parse(options.body)).toEqual({ name: "Fight", systemCode: "dnd5e" });
  });

  it("getCampaignEncounters uses GET with auth", async () => {
    await getCampaignEncounters("token-y", 7);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/campaigns/7/encounters");
    expect(options.method).toBe("GET");
    expect(options.headers.Authorization).toBe("Bearer token-y");
  });

  it("addEncounterParticipant sends participant payload", async () => {
    await addEncounterParticipant("token-z", 3, 4, { name: "Goblin", participantType: "MONSTER", initiativeValue: 12 });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/campaigns/3/encounters/4/participants");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body).name).toBe("Goblin");
  });

  it("turn and HP endpoints use correct paths", async () => {
    await nextEncounterTurn("token", 5, 6);
    await applyParticipantDamage("token", 5, 6, 99, 7);
    await healParticipant("token", 5, 6, 99, 4);
    const calledUrls = global.fetch.mock.calls.map((call) => call[0]);
    expect(calledUrls.some((u) => u.includes("/api/campaigns/5/encounters/6/next-turn"))).toBe(true);
    expect(calledUrls.some((u) => u.includes("/participants/99/damage"))).toBe(true);
    expect(calledUrls.some((u) => u.includes("/participants/99/heal"))).toBe(true);
  });

  it("dice helpers send expression and filter query", async () => {
    await createDiceRoll("token", 8, { rollExpression: "1d20+3" });
    await getCampaignDiceRolls("token", 8, { limit: 20, encounterId: 11 });
    const [postUrl, postOptions] = global.fetch.mock.calls[0];
    const [getUrl, getOptions] = global.fetch.mock.calls[1];
    expect(postUrl).toContain("/api/campaigns/8/dice-rolls");
    expect(JSON.parse(postOptions.body).rollExpression).toBe("1d20+3");
    expect(getUrl).toContain("/api/campaigns/8/dice-rolls?limit=20&encounterId=11");
    expect(getOptions.method).toBe("GET");
  });

  it("live state helpers use expected endpoints", async () => {
    await getSessionLiveState("token", 8, 4);
    await updateSessionLiveState("token", 8, 4, { sceneTitle: "Harbor" });
    const [getUrl, getOptions] = global.fetch.mock.calls[0];
    const [patchUrl, patchOptions] = global.fetch.mock.calls[1];
    expect(getUrl).toContain("/api/campaigns/8/sessions/4/live-state");
    expect(getOptions.method).toBe("GET");
    expect(patchUrl).toContain("/api/campaigns/8/sessions/4/live-state");
    expect(patchOptions.method).toBe("PATCH");
    expect(JSON.parse(patchOptions.body)).toEqual({ sceneTitle: "Harbor" });
  });

  it("attendance helpers use expected endpoints", async () => {
    await getSessionAttendance("token", 8, 4);
    await updateMySessionAttendance("token", 8, 4, { status: "MAYBE", note: "late" });
    const [getUrl, getOptions] = global.fetch.mock.calls[0];
    const [putUrl, putOptions] = global.fetch.mock.calls[1];
    expect(getUrl).toContain("/api/campaigns/8/sessions/4/attendance");
    expect(getOptions.method).toBe("GET");
    expect(putUrl).toContain("/api/campaigns/8/sessions/4/attendance/me");
    expect(putOptions.method).toBe("PUT");
    expect(JSON.parse(putOptions.body)).toEqual({ status: "MAYBE", note: "late" });
  });

  it("player notes helpers use expected endpoints", async () => {
    await getCampaignPlayerNotes("token", 8);
    await createCampaignPlayerNote("token", 8, { title: "a", content: "b" });
    await updateCampaignPlayerNote("token", 8, 3, { title: "c", content: "d" });
    await deleteCampaignPlayerNote("token", 8, 3);
    const urls = global.fetch.mock.calls.map((call) => call[0]);
    expect(urls.some((u) => u.includes("/api/campaigns/8/player-notes"))).toBe(true);
    expect(urls.some((u) => u.includes("/api/campaigns/8/player-notes/3"))).toBe(true);
  });

  it("requested rolls helpers use expected endpoints", async () => {
    await createRequestedRoll("token", 8, 4, { targetMode: "ALL", rollLabel: "Perception" });
    await getRequestedRolls("token", 8, 4);
    await fulfillRequestedRoll("token", 8, 4, 12, {});
    await cancelRequestedRoll("token", 8, 4, 12);
    const urls = global.fetch.mock.calls.map((call) => call[0]);
    expect(urls.some((u) => u.includes("/api/campaigns/8/sessions/4/requested-rolls"))).toBe(true);
    expect(urls.some((u) => u.includes("/requested-rolls/12/fulfill"))).toBe(true);
    expect(urls.some((u) => u.includes("/requested-rolls/12/cancel"))).toBe(true);
  });

  it("propagates user-friendly error from http", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => "application/json" },
      json: async () => ({ message: "missing" }),
    });
    await expect(getCampaignEncounters("token", 999)).rejects.toThrow("Nie znaleziono zasobu.");
  });
});
