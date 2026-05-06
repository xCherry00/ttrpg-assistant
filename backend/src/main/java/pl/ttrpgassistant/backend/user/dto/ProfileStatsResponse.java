package pl.ttrpgassistant.backend.user.dto;

public record ProfileStatsResponse(
        int campaignsTotal,
        int campaignsAsGm,
        int sessionsTotal,
        int generatedThingsTotal,
        int notesTotal,
        long timeSpentHours
) {}
