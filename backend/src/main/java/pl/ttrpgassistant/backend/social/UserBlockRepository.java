package pl.ttrpgassistant.backend.social;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBlockRepository extends JpaRepository<UserBlockEntity, UserBlockId> {

    boolean existsByIdBlockerUserIdAndIdBlockedUserId(Long blockerUserId, Long blockedUserId);
    List<UserBlockEntity> findByIdBlockerUserId(Long blockerUserId);
    void deleteByIdBlockerUserIdAndIdBlockedUserId(Long blockerUserId, Long blockedUserId);
}
