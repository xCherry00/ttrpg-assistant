package pl.ttrpgassistant.backend.character.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateCharacterSheetRequest(
        @Size(max = 160) String name,
        @Size(max = 2500000) String portraitUrl,
        @Min(0) @Max(999) Integer currentHp,
        @Min(0) @Max(999) Integer tempHp,
        @Size(max = 12000) String privateNotes,
        List<@Size(max = 200) String> inventory
) {}
