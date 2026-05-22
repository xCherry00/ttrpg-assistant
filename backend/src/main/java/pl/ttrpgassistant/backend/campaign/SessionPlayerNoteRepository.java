package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SessionPlayerNoteRepository extends JpaRepository<SessionPlayerNoteEntity, Long> {
    Optional<SessionPlayerNoteEntity> findBySessionIdAndUserId(Long sessionId, Long userId);
    List<SessionPlayerNoteEntity> findByUserIdAndSessionIdIn(Long userId, Collection<Long> sessionIds);
}
