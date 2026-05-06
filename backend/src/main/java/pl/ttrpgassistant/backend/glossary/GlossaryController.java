package pl.ttrpgassistant.backend.glossary;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/glossary")
public class GlossaryController {

    private final GlossaryRepository repo;

    public GlossaryController(GlossaryRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<GlossaryTerm> list() {
        return repo.findAll();
    }
}
