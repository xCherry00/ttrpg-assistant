package pl.ttrpgassistant.backend.user.dto;

public record ProfileAchievementResponse(
        String key,
        String title,
        String description,
        int target,
        int progress,
        boolean unlocked
) {}
