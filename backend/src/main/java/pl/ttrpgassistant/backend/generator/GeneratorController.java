package pl.ttrpgassistant.backend.generator;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.generator.dto.GeneratorPoolResponse;

@RestController
@RequestMapping("/api/generators")
public class GeneratorController {

    private final GeneratorService service;

    public GeneratorController(GeneratorService service) {
        this.service = service;
    }

    @GetMapping("/pool")
    public GeneratorPoolResponse getPool(
            @RequestParam String type,
            @RequestParam String system
    ) {
        return service.getPool(type, system);
    }
}
