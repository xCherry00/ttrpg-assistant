package pl.ttrpgassistant.backend.rules;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RulesRepository extends JpaRepository<RulesPage, Long> {
    List<RulesPage> findBySystemCodeOrderByIdAsc(String systemCode);
}
