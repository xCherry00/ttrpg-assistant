package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateRequestedRollRequest(
        @NotBlank String targetMode,
        List<Long> targetUserIds,
        List<Long> targetCharacterIds,
        @NotBlank @Size(max = 160) String rollLabel,
        @Size(max = 40) String rollType,
        @Size(max = 120) String rollExpression,
        @Size(max = 80) String abilityKey,
        @Size(max = 80) String skillKey,
        Integer dc,
        Boolean isDcHidden,
        Boolean showSuccessToPlayer
) {}
