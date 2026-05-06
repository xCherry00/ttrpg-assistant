package pl.ttrpgassistant.backend.rules;

import org.springframework.web.bind.annotation.*;
import pl.ttrpgassistant.backend.system.SystemCodeRegistry;

import java.util.List;

@RestController
@RequestMapping("/api/rules")
public class RulesController {

    private final RulesRepository repo;

    public RulesController(RulesRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/dnd")
    public List<RulesPage> dnd() {
        return repo.findBySystemCodeOrderByIdAsc("dnd");
    }

    @GetMapping("/{system}")
    public List<RulesPage> getRulesBySystem(
            @PathVariable String system,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q
    ) {
        String normalizedSystem = SystemCodeRegistry.normalize(system);
        String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
        String normalizedQuery = q == null || q.isBlank() ? null : q.trim();
        return repo.search(normalizedSystem, normalizedCategory, normalizedQuery);
    }
}
