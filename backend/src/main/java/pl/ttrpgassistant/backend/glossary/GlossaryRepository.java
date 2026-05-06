package pl.ttrpgassistant.backend.glossary;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GlossaryRepository extends JpaRepository<GlossaryTerm, Long> {}
