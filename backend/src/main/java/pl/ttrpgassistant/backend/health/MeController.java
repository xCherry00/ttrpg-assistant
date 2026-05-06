package pl.ttrpgassistant.backend.health;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.user.UserSettingsService;
import pl.ttrpgassistant.backend.user.dto.MeResponse;

@RestController
@RequiredArgsConstructor
public class MeController {

    private final UserSettingsService userSettingsService;

    @GetMapping("/api/me")
    public MeResponse me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return userSettingsService.getCurrentUser(userId);
    }
}
