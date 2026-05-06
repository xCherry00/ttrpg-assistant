package pl.ttrpgassistant.backend.user.dto;

import java.util.List;

public record ProfileDashboardResponse(
        ProfileStatsResponse stats,
        List<ProfileActivityItemResponse> recentActivity,
        List<ProfileFavoriteToolResponse> favoriteTools,
        List<ProfileAchievementResponse> achievements
) {}
