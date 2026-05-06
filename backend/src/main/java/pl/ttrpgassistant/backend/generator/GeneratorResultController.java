package pl.ttrpgassistant.backend.generator;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRecentResultResponse;

import java.util.List;

@RestController
@RequestMapping("/api/generator-results")
public class GeneratorResultController {
    private final GeneratorService service;

    public GeneratorResultController(GeneratorService service) {
        this.service = service;
    }

    @GetMapping("/recent")
    public List<GeneratorRecentResultResponse> recent() {
        return service.recentResults();
    }
}
