package pl.ttrpgassistant.backend.generator;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.generator.dto.GeneratorCatalogItem;
import pl.ttrpgassistant.backend.generator.dto.GeneratorDefinitionResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorFormResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorPoolResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorResultResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorVariantResponse;

import java.util.List;

@RestController
@RequestMapping("/api/generators")
public class GeneratorController {

    private final GeneratorService service;

    public GeneratorController(GeneratorService service) {
        this.service = service;
    }

    @GetMapping("/catalog")
    public List<GeneratorCatalogItem> catalog() {
        return service.catalog();
    }

    @GetMapping
    public List<GeneratorDefinitionResponse> definitions() {
        return service.definitions();
    }

    @GetMapping("/{generatorCode}/variants")
    public List<GeneratorVariantResponse> variants(@PathVariable String generatorCode) {
        return service.variants(generatorCode);
    }

    @GetMapping("/{generatorCode}/{variantCode}/form")
    public GeneratorFormResponse form(
            @PathVariable String generatorCode,
            @PathVariable String variantCode
    ) {
        return service.form(generatorCode, variantCode);
    }

    @GetMapping("/pool")
    public GeneratorPoolResponse getPool(
            @RequestParam String type,
            @RequestParam String system
    ) {
        return service.getPool(type, system);
    }

    @PostMapping("/{system}/{type}/generate")
    public Object generate(
            @PathVariable String system,
            @PathVariable String type,
            @RequestBody(required = false) GeneratorRequest request
    ) {
        if (service.hasVariant(system, type)) {
            return service.generateVariant(system, type, request);
        }
        return service.generate(system, type, request);
    }
}
