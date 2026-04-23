package pl.ttrpgassistant.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<UserEntity> findByUsernameIgnoreCaseAndTagCode(String username, Integer tagCode);

    @Query(value = """
            select *
            from users u
            where u.id <> :viewerUserId
              and (
                lower(coalesce(u.display_name, '')) like concat('%', lower(:query), '%')
                or lower(u.username) like concat('%', lower(:query), '%')
                or lower(concat(u.username, '#', lpad(cast(u.tag_code as text), 4, '0'))) like concat('%', lower(:query), '%')
              )
            order by lower(coalesce(u.display_name, u.username)), u.id
            limit 20
            """, nativeQuery = true)
    List<UserEntity> searchDiscoverableUsers(@Param("viewerUserId") Long viewerUserId, @Param("query") String query);
}
