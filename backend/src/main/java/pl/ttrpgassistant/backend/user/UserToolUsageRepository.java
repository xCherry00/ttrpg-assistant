package pl.ttrpgassistant.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserToolUsageRepository extends JpaRepository<UserToolUsageEntity, Long> {

    Optional<UserToolUsageEntity> findByUserIdAndToolKey(Long userId, String toolKey);

    List<UserToolUsageEntity> findByUserIdOrderByUsageCountDescLastUsedAtDesc(Long userId);
}
