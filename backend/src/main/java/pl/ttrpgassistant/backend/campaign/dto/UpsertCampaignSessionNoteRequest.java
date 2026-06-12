package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Size;

public record UpsertCampaignSessionNoteRequest(
        @Size(max = 10000) String summary,
        @Size(max = 10000) String importantEvents,
        @Size(max = 10000) String loot,
        @Size(max = 10000) String npcRefs,
        @Size(max = 10000) String decisions,
        @Size(max = 10000) String nextHooks
) {}
