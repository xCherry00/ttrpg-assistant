package pl.ttrpgassistant.backend.generator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GeneratorFieldDefinitionRepository extends JpaRepository<GeneratorFieldDefinitionEntity, Long> {
    List<GeneratorFieldDefinitionEntity> findByVariant_IdOrderByOrderIndexAsc(Long variantId);
}
