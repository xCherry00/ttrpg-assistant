package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SetTemporaryHpRequest(
        @NotNull @Min(0) Integer amount
) {}
