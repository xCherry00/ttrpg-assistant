package pl.ttrpgassistant.backend.social;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendshipRepository extends JpaRepository<FriendshipEntity, FriendshipId> {

    List<FriendshipEntity> findByIdUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByIdUserIdAndIdFriendUserId(Long userId, Long friendUserId);
    long countByIdUserId(Long userId);
    void deleteByIdUserIdAndIdFriendUserId(Long userId, Long friendUserId);
}
