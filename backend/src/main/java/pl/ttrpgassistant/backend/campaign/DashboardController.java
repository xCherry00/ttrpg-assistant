package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.campaign.dto.DashboardSessionNoteBacklogItem;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/session-note-backlog")
    public List<DashboardSessionNoteBacklogItem> sessionNoteBacklog(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return dashboardService.sessionNoteBacklog(userId);
    }
}
