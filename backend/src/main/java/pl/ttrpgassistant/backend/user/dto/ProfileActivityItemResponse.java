package pl.ttrpgassistant.backend.user.dto;

import java.time.Instant;

public record ProfileActivityItemResponse(
        String type,
        String title,
        String subtitle,
        Instant createdAt
) {}
