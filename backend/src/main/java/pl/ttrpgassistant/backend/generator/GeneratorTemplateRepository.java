package pl.ttrpgassistant.backend.generator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GeneratorTemplateRepository extends JpaRepository<GeneratorTemplateEntity, Long> {
    List<GeneratorTemplateEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
}
