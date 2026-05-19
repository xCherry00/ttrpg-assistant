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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterDetailsResponse;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterSummaryResponse;
import pl.ttrpgassistant.backend.character.dto.QuickCreateDndCharacterRequest;
import pl.ttrpgassistant.backend.character.dto.UpdateCharacterSheetRequest;
import pl.ttrpgassistant.backend.common.pagination.PagedResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PlayerCharacterController {

    private final PlayerCharacterService playerCharacterService;

    @GetMapping("/api/characters")
    public PagedResponse<PlayerCharacterSummaryResponse> list(
            Authentication auth,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Long userId = (Long) auth.getPrincipal();
        return PagedResponse.of(playerCharacterService.listForUser(userId), page, size);
    }

    @GetMapping("/api/characters/{characterId}")
    public PlayerCharacterDetailsResponse get(Authentication auth, @PathVariable Long characterId) {
        Long userId = (Long) auth.getPrincipal();
        return playerCharacterService.getForUser(userId, characterId);
    }

    @DeleteMapping("/api/characters/{characterId}")
    public void delete(Authentication auth, @PathVariable Long characterId) {
        Long userId = (Long) auth.getPrincipal();
        playerCharacterService.delete(userId, characterId);
    }

    @PutMapping("/api/characters/{characterId}/sheet")
    public PlayerCharacterDetailsResponse updateSheet(
            Authentication auth,
            @PathVariable Long characterId,
            @Valid @RequestBody UpdateCharacterSheetRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return playerCharacterService.updateSheet(userId, characterId, request);
    }

    @PostMapping("/api/characters/dnd/quick-create")
    public PlayerCharacterDetailsResponse quickCreate(
            Authentication auth,
            @Valid @RequestBody QuickCreateDndCharacterRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return playerCharacterService.quickCreate(userId, request);
    }

    @GetMapping("/api/compendium/dnd/classes")
    public List<Map<String, Object>> dndClasses() {
        return playerCharacterService.compendiumClasses();
    }

    @GetMapping("/api/compendium/dnd/races")
    public List<Map<String, Object>> dndRaces() {
        return playerCharacterService.compendiumRaces();
    }

    @GetMapping("/api/compendium/dnd/backgrounds")
    public List<Map<String, Object>> dndBackgrounds() {
        return playerCharacterService.compendiumBackgrounds();
    }
}
