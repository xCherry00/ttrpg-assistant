package pl.ttrpgassistant.backend.realtime;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/realtime")
@RequiredArgsConstructor
public class RealtimeController {

    private final RealtimeEventService realtimeEventService;

    @GetMapping("/events")
    public SseEmitter events(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return realtimeEventService.connect(userId);
    }
}
