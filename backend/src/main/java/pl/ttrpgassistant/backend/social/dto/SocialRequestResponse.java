package pl.ttrpgassistant.backend.social.dto;

import java.time.Instant;

public record SocialRequestResponse(
        Long id,
        SocialUserCardResponse user,
        Instant createdAt
) {}
