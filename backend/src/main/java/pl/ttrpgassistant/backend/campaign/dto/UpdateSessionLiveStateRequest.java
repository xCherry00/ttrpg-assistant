package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Size;
import pl.ttrpgassistant.backend.common.validation.SafeImageOrHttpUrl;

public record UpdateSessionLiveStateRequest(
        @Size(max = 160) String sceneTitle,
        @Size(max = 2_000_000) @SafeImageOrHttpUrl String sceneImageUrl,
        @Size(max = 5000) String sceneDescription,
        Long activeEncounterId
) {}
