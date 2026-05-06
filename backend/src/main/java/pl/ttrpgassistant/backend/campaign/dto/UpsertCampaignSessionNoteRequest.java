package pl.ttrpgassistant.backend.campaign.dto;

public record UpsertCampaignSessionNoteRequest(
        String summary,
        String importantEvents,
        String loot,
        String npcRefs,
        String decisions,
        String nextHooks
) {}
