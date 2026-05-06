package pl.ttrpgassistant.backend.rules;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RulesRepository extends JpaRepository<RulesPage, Long> {
    List<RulesPage> findBySystemCodeOrderByIdAsc(String systemCode);

    @Query("""
            select r from RulesPage r
            where r.systemCode = :system
              and (:category is null or r.category = :category)
              and (:query is null or lower(r.title) like lower(concat('%', :query, '%')) or lower(r.content) like lower(concat('%', :query, '%')) or lower(coalesce(r.summary, '')) like lower(concat('%', :query, '%')))
            order by r.sortOrder asc, r.id asc
            """)
    List<RulesPage> search(@Param("system") String system, @Param("category") String category, @Param("query") String query);
}
