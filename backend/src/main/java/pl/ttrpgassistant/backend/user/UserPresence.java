package pl.ttrpgassistant.backend.user;

import java.time.Duration;
import java.time.Instant;

public final class UserPresence {
    public static final Duration ONLINE_WINDOW = Duration.ofMinutes(5);
    public static final Duration HEARTBEAT_THROTTLE = Duration.ofSeconds(60);

    private UserPresence() {
    }

    public static boolean isOnline(UserEntity user) {
        if (user == null || user.getLastActiveAt() == null || user.getActivityVisibility() == ProfileVisibility.PRIVATE) {
            return false;
        }
        return Duration.between(user.getLastActiveAt(), Instant.now()).compareTo(ONLINE_WINDOW) <= 0;
    }

    public static boolean shouldRefresh(UserEntity user) {
        if (user == null || user.getLastActiveAt() == null) {
            return true;
        }
        return Duration.between(user.getLastActiveAt(), Instant.now()).compareTo(HEARTBEAT_THROTTLE) >= 0;
    }

    public static String activityLabel(UserEntity user) {
        if (user == null || user.getLastActiveAt() == null || user.getActivityVisibility() == ProfileVisibility.PRIVATE) {
            return "aktywność ukryta";
        }
        if (isOnline(user)) {
            return "aktywny teraz";
        }

        Duration duration = Duration.between(user.getLastActiveAt(), Instant.now());
        if (duration.toHours() < 24) {
            return "aktywny dzisiaj";
        }
        if (duration.toDays() < 7) {
            return "aktywny w tym tygodniu";
        }
        if (duration.toDays() < 30) {
            return "aktywny w tym miesiącu";
        }
        return "dawno nieaktywny";
    }
}
