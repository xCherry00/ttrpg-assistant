package pl.ttrpgassistant.backend.user.dto;

import java.time.Instant;

public record ProfileFavoriteToolResponse(
        String toolKey,
        String title,
        String description,
        long uses,
        Instant lastUsedAt
) {}
