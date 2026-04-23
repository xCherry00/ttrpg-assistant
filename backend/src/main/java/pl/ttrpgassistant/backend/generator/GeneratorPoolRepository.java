package pl.ttrpgassistant.backend.generator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GeneratorPoolRepository extends JpaRepository<GeneratorPoolEntity, Long> {
    Optional<GeneratorPoolEntity> findByGeneratorTypeAndSystemCode(String generatorType, String systemCode);
}
