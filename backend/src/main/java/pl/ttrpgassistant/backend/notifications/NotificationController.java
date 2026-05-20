package pl.ttrpgassistant.backend.notifications;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.notifications.dto.NotificationOverviewResponse;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public NotificationOverviewResponse overview(
            Authentication auth,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Long userId = (Long) auth.getPrincipal();
        return notificationService.overview(userId, page, size);
    }

    @PostMapping("/{id}/read")
    public NotificationOverviewResponse markRead(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return notificationService.markRead(userId, id);
    }

    @PostMapping("/read-all")
    public NotificationOverviewResponse markAllRead(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return notificationService.markAllRead(userId);
    }

    @DeleteMapping("/{id}")
    public NotificationOverviewResponse deleteOne(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return notificationService.deleteOne(userId, id);
    }

    @DeleteMapping
    public NotificationOverviewResponse clearAll(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return notificationService.clearAll(userId);
    }
}
