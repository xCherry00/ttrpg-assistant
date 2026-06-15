package pl.ttrpgassistant.backend.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.ttrpgassistant.backend.notes.UserNoteType;

public record UpdateUserNoteRequest(
        @NotBlank @Size(max = 120) String title,
        @NotNull UserNoteType type,
        @Size(max = 12000) String content,
        Long campaignId,
        Long characterId
) {}
