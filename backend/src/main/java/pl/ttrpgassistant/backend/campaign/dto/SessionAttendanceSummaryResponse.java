package pl.ttrpgassistant.backend.campaign.dto;

import java.util.List;

public record SessionAttendanceSummaryResponse(
        Long sessionId,
        int availableCount,
        int maybeCount,
        int unavailableCount,
        int noResponseCount,
        List<SessionAttendanceResponse> responses
) {}
