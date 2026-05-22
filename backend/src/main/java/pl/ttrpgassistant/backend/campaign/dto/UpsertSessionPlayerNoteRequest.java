package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Size;

public record UpsertSessionPlayerNoteRequest(
        @Size(max = 120) String title,
        @Size(max = 10000) String content
) {}
