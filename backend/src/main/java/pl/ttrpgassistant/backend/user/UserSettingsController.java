package pl.ttrpgassistant.backend.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.user.dto.ChangePasswordRequest;
import pl.ttrpgassistant.backend.user.dto.DeleteAccountRequest;
import pl.ttrpgassistant.backend.user.dto.MeResponse;
import pl.ttrpgassistant.backend.user.dto.UpdateChatNickColorRequest;
import pl.ttrpgassistant.backend.user.dto.UpdateDisplayNameRequest;
import pl.ttrpgassistant.backend.user.dto.UpdateEmailRequest;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping("/me")
    public MeResponse me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return userSettingsService.getCurrentUser(userId);
    }

    @PatchMapping("/display-name")
    public MeResponse updateDisplayName(
            Authentication auth,
            @Valid @RequestBody UpdateDisplayNameRequest req
    ) {
        Long userId = (Long) auth.getPrincipal();
        return userSettingsService.updateDisplayName(userId, req.displayName());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            Authentication auth,
            @Valid @RequestBody ChangePasswordRequest req
    ) {
        Long userId = (Long) auth.getPrincipal();
        userSettingsService.changePassword(userId, req);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/email")
    public MeResponse updateEmail(
            Authentication auth,
            @Valid @RequestBody UpdateEmailRequest req
    ) {
        Long userId = (Long) auth.getPrincipal();
        return userSettingsService.updateEmail(userId, req);
    }

    @PatchMapping("/chat-nick-color")
    public MeResponse updateChatNickColor(
            Authentication auth,
            @Valid @RequestBody UpdateChatNickColorRequest req
    ) {
        Long userId = (Long) auth.getPrincipal();
        return userSettingsService.updateChatNickColor(userId, req);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(
            Authentication auth,
            @Valid @RequestBody DeleteAccountRequest req
    ) {
        Long userId = (Long) auth.getPrincipal();
        userSettingsService.deleteAccount(userId, req);
        return ResponseEntity.noContent().build();
    }
}
