package pl.ttrpgassistant.backend.character.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import pl.ttrpgassistant.backend.common.validation.SafeImageOrHttpUrl;

public record CreateCocQuickCharacterRequest(
        @Size(max = 80) String firstName,
        @Size(max = 80) String lastName,
        @Min(15) @Max(95) Integer age,
        @Size(max = 30) String sex,
        @Size(max = 80) String occupationIndex,
        @Size(max = 2500000) @SafeImageOrHttpUrl String portraitUrl
) {}
