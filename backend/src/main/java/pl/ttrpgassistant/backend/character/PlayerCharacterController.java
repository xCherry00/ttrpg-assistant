package pl.ttrpgassistant.backend.character;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterDetailsResponse;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterSummaryResponse;
import pl.ttrpgassistant.backend.character.dto.UpsertPlayerCharacterRequest;

import java.util.List;

@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class PlayerCharacterController {

    private final PlayerCharacterService playerCharacterService;

    @GetMapping
    public List<PlayerCharacterSummaryResponse> list(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return playerCharacterService.listForUser(userId);
    }

    @GetMapping("/{characterId}")
    public PlayerCharacterDetailsResponse get(Authentication auth, @PathVariable Long characterId) {
        Long userId = (Long) auth.getPrincipal();
        return playerCharacterService.getForUser(userId, characterId);
    }

    @PostMapping
    public PlayerCharacterDetailsResponse create(Authentication auth, @Valid @RequestBody UpsertPlayerCharacterRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return playerCharacterService.create(userId, request);
    }

    @PutMapping("/{characterId}")
    public PlayerCharacterDetailsResponse update(
            Authentication auth,
            @PathVariable Long characterId,
            @Valid @RequestBody UpsertPlayerCharacterRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return playerCharacterService.update(userId, characterId, request);
    }

    @DeleteMapping("/{characterId}")
    public void delete(Authentication auth, @PathVariable Long characterId) {
        Long userId = (Long) auth.getPrincipal();
        playerCharacterService.delete(userId, characterId);
    }
}
