package pl.ttrpgassistant.backend.user.dto;

import jakarta.validation.constraints.Size;
import pl.ttrpgassistant.backend.common.validation.SafeImageOrHttpUrl;

public record UpdateProfileImagesRequest(
        @Size(max = 2000) @SafeImageOrHttpUrl String avatarUrl,
        @Size(max = 2000) @SafeImageOrHttpUrl String profileBannerUrl
) {}
