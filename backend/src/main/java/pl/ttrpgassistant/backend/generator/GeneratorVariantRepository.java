package pl.ttrpgassistant.backend.generator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GeneratorVariantRepository extends JpaRepository<GeneratorVariantEntity, Long> {
    List<GeneratorVariantEntity> findByGeneratorDefinition_CodeAndActiveTrueOrderByNameAsc(String generatorCode);

    Optional<GeneratorVariantEntity> findByGeneratorDefinition_CodeAndVariantCodeAndActiveTrue(String generatorCode, String variantCode);

    boolean existsByGeneratorDefinition_CodeAndVariantCodeAndActiveTrue(String generatorCode, String variantCode);
}
