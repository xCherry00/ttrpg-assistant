package pl.ttrpgassistant.backend.social;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.ttrpgassistant.backend.social.dto.PublicProfileResponse;
import pl.ttrpgassistant.backend.social.dto.SocialOverviewResponse;
import pl.ttrpgassistant.backend.social.dto.SocialUserCardResponse;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;

    @GetMapping("/overview")
    public SocialOverviewResponse overview(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return socialService.getOverview(userId);
    }

    @GetMapping("/discover")
    public List<SocialUserCardResponse> discover(Authentication auth, @RequestParam(defaultValue = "") String q) {
        Long userId = (Long) auth.getPrincipal();
        return socialService.discoverUsers(userId, q);
    }

    @GetMapping("/users/{handle}")
    public PublicProfileResponse publicProfile(Authentication auth, @PathVariable String handle) {
        Long userId = (Long) auth.getPrincipal();
        return socialService.getPublicProfile(userId, handle);
    }

    @PostMapping("/requests/{targetUserId}")
    public ResponseEntity<Void> sendRequest(Authentication auth, @PathVariable Long targetUserId) {
        Long userId = (Long) auth.getPrincipal();
        socialService.sendFriendRequest(userId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<Void> acceptRequest(Authentication auth, @PathVariable Long requestId) {
        Long userId = (Long) auth.getPrincipal();
        socialService.acceptFriendRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<Void> rejectRequest(Authentication auth, @PathVariable Long requestId) {
        Long userId = (Long) auth.getPrincipal();
        socialService.rejectFriendRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/requests/{requestId}/cancel")
    public ResponseEntity<Void> cancelRequest(Authentication auth, @PathVariable Long requestId) {
        Long userId = (Long) auth.getPrincipal();
        socialService.cancelFriendRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/friends/{targetUserId}")
    public ResponseEntity<Void> removeFriend(Authentication auth, @PathVariable Long targetUserId) {
        Long userId = (Long) auth.getPrincipal();
        socialService.removeFriend(userId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/blocks/{targetUserId}")
    public ResponseEntity<Void> blockUser(Authentication auth, @PathVariable Long targetUserId) {
        Long userId = (Long) auth.getPrincipal();
        socialService.blockUser(userId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/blocks/{targetUserId}")
    public ResponseEntity<Void> unblockUser(Authentication auth, @PathVariable Long targetUserId) {
        Long userId = (Long) auth.getPrincipal();
        socialService.unblockUser(userId, targetUserId);
        return ResponseEntity.noContent().build();
    }
}
