package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Size;

public record FulfillRequestedRollRequest(
        @Size(max = 120) String rollExpression,
        Integer manualModifier
) {}
