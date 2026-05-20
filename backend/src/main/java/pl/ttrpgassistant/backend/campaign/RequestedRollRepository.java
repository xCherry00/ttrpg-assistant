package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestedRollRepository extends JpaRepository<RequestedRollEntity, Long> {
    List<RequestedRollEntity> findBySessionIdOrderByCreatedAtDesc(Long sessionId);
}
