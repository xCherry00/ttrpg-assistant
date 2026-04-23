package pl.ttrpgassistant.backend.rules;

import org.springframework.web.bind.annotation.*;
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
    public List<RulesPage> getRulesBySystem(@PathVariable String system) {
        return repo.findBySystemCodeOrderByIdAsc(system);
    }
}
