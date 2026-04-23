package pl.ttrpgassistant.backend.character.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpsertPlayerCharacterRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 20) String status,
        @Size(max = 400000) String portraitUrl,
        @Size(max = 120) String raceName,
        @Size(max = 120) String subraceName,
        @Size(max = 120) String className,
        @Size(max = 120) String subclassName,
        @Size(max = 120) String backgroundName,
        @Size(max = 80) String alignment,
        @Min(1) @Max(20) Integer level,
        @Min(0) @Max(355000) Integer experiencePoints,
        @Pattern(regexp = "MANUAL|STANDARD_ARRAY|ROLLED", message = "abilityMode must be MANUAL, STANDARD_ARRAY or ROLLED") String abilityMode,
        @Min(1) @Max(30) Integer strength,
        @Min(1) @Max(30) Integer dexterity,
        @Min(1) @Max(30) Integer constitution,
        @Min(1) @Max(30) Integer intelligence,
        @Min(1) @Max(30) Integer wisdom,
        @Min(1) @Max(30) Integer charisma,
        @Min(1) @Max(999) Integer maxHp,
        @Min(0) @Max(999) Integer currentHp,
        @Min(0) @Max(999) Integer tempHp,
        @Min(1) @Max(99) Integer armorClass,
        @Min(-20) @Max(20) Integer initiativeBonus,
        @Min(0) @Max(200) Integer speed,
        @Min(2) @Max(9) Integer proficiencyBonus,
        @Size(max = 60) String hitDice,
        @Size(max = 6000) String skillNotes,
        @Size(max = 6000) String savingThrowNotes,
        @Size(max = 10000) String equipmentNotes,
        @Size(max = 10000) String featureNotes,
        @Size(max = 10000) String personalityNotes,
        @Size(max = 12000) String privateNotes
) {}
