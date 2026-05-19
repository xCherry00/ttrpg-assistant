package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ApplyDamageRequest(
        @NotNull @Min(0) Integer amount
) {}
