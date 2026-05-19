package pl.ttrpgassistant.backend.character.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuickCreateDndCharacterRequest(
        @NotBlank @Size(max = 160) String name,
        @NotBlank @Size(max = 100) String raceIndex,
        @NotBlank @Size(max = 100) String classIndex,
        @NotBlank @Size(max = 100) String backgroundIndex,
        @Size(max = 2500000) String portraitUrl
) {}
