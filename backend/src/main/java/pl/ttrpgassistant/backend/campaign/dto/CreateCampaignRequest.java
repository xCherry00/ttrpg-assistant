package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import pl.ttrpgassistant.backend.common.validation.SafeImageOrHttpUrl;

public record CreateCampaignRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 32) String systemCode,
        @Size(max = 2000) String description,
        @Size(max = 2_000_000) @SafeImageOrHttpUrl String coverImageUrl,
        @Size(max = 20) String visibility,
        @Min(1) @Max(20) Integer playerLimit
) {}
