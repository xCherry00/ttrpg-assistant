package pl.ttrpgassistant.backend.compendium;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.compendium.dto.DndConditionResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterDetailsResponse;
import pl.ttrpgassistant.backend.compendium.dto.DndMonsterSummaryResponse;

import java.util.List;

@RestController
@RequestMapping("/api/compendium/dnd5e")
public class DndInitiativeLookupController {

    private final DndInitiativeLookupService service;

    public DndInitiativeLookupController(DndInitiativeLookupService service) {
        this.service = service;
    }

    @GetMapping("/monsters")
    public List<DndMonsterSummaryResponse> searchMonsters(@RequestParam(value = "q", required = false) String query) {
        return service.searchMonsters(query);
    }

    @GetMapping("/monsters/{index}")
    public DndMonsterDetailsResponse monsterDetails(@PathVariable String index) {
        return service.monsterDetails(index);
    }

    @GetMapping("/conditions")
    public List<DndConditionResponse> conditions() {
        return service.conditions();
    }
}

