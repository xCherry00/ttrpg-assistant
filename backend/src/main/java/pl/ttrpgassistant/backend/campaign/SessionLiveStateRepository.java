package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SessionLiveStateRepository extends JpaRepository<SessionLiveStateEntity, Long> {
    Optional<SessionLiveStateEntity> findBySessionId(Long sessionId);
}
