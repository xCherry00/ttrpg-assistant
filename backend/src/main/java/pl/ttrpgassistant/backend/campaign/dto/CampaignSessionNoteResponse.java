package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignSessionNoteResponse(
        Long sessionId,
        String summary,
        String importantEvents,
        String loot,
        String npcRefs,
        String decisions,
        String nextHooks,
        Instant createdAt,
        Instant updatedAt,
        String updatedByDisplayName,
        boolean updatedAfterFinish
) {}
