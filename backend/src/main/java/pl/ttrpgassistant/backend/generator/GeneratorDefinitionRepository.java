package pl.ttrpgassistant.backend.generator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GeneratorDefinitionRepository extends JpaRepository<GeneratorDefinitionEntity, Long> {
    List<GeneratorDefinitionEntity> findByActiveTrueOrderByNameAsc();

    Optional<GeneratorDefinitionEntity> findByCodeAndActiveTrue(String code);
}
