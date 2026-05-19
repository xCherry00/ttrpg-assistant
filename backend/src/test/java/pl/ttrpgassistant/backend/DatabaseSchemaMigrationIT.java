package pl.ttrpgassistant.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabaseSchemaMigrationIT {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void campaignsJoinCodeShouldUsePartialUniqueIndexForActiveRowsOnly() {
        Integer partialIndexCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from pg_indexes
                where schemaname = 'public'
                  and tablename = 'campaigns'
                  and indexname = 'ux_campaigns_join_code_active'
                  and indexdef ilike '%unique index%'
                  and indexdef ilike '%(join_code)%'
                  and indexdef ilike '%where (deleted_at is null)%'
                """,
                Integer.class
        );

        Integer legacyIndexCount = jdbcTemplate.queryForObject(
                """
                select count(*)
                from pg_indexes
                where schemaname = 'public'
                  and tablename = 'campaigns'
                  and indexname = 'ux_campaigns_join_code'
                """,
                Integer.class
        );

        assertThat(partialIndexCount).isEqualTo(1);
        assertThat(legacyIndexCount).isEqualTo(0);
    }
}
