package pl.ttrpgassistant.backend.generator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GeneratorResultRepository extends JpaRepository<GeneratorResultEntity, Long> {
    List<GeneratorResultEntity> findTop10ByOrderByCreatedAtDesc();
}
