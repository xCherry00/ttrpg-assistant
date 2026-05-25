package pl.ttrpgassistant.backend.character.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CharacterImportRequest(
        @NotBlank @Size(max = 40) String exportVersion,
        @NotNull @Valid CharacterImportPayload character
) {
    public record CharacterImportPayload(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Size(max = 32) String systemCode,
            @Size(max = 120) String raceName,
            @Size(max = 120) String className,
            @Size(max = 120) String backgroundName,
            Integer level,
            @Size(max = 400000) String portraitUrl,
            @NotNull Map<String, Object> sheetJson,
            Map<String, Object> metadata
    ) {}
}
