package pl.ttrpgassistant.backend.compendium;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compendium")
public class CompendiumController {
    private final CompendiumService compendiumService;

    public CompendiumController(CompendiumService compendiumService) {
        this.compendiumService = compendiumService;
    }

    @GetMapping("/systems")
    public List<Map<String, Object>> systems() {
        return compendiumService.systems();
    }

    @GetMapping("/{systemCode}/categories")
    public List<Map<String, Object>> categories(@PathVariable String systemCode) {
        return compendiumService.categories(systemCode);
    }

    @GetMapping("/{systemCode}/{category}")
    public Map<String, Object> list(@PathVariable String systemCode, @PathVariable String category) {
        return compendiumService.list(systemCode, category);
    }

    @GetMapping("/{systemCode}/{category}/{index}")
    public Map<String, Object> detail(@PathVariable String systemCode, @PathVariable String category, @PathVariable String index) {
        return compendiumService.detail(systemCode, category, index);
    }
}
