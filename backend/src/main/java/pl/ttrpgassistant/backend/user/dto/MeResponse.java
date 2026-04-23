package pl.ttrpgassistant.backend.user.dto;

public record MeResponse(
        Long id,
        String email,
        String displayName,
        String username,
        Integer tagCode,
        String handle,
        String bio,
        String favoriteSystem,
        String chatNickColor,
        String role,
        boolean isMg
) {}
