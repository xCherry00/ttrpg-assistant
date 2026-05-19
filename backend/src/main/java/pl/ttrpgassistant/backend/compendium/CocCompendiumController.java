package pl.ttrpgassistant.backend.compendium;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.character.CocOccupationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compendium/coc7e")
@RequiredArgsConstructor
public class CocCompendiumController {

    private final CocOccupationService cocOccupationService;

    @GetMapping("/occupations")
    public List<Map<String, Object>> occupations() {
        return cocOccupationService.occupations();
    }
}
