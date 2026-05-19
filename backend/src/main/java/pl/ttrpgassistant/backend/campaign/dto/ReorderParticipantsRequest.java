package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReorderParticipantsRequest(
        @NotEmpty List<Long> participantIds
) {}
