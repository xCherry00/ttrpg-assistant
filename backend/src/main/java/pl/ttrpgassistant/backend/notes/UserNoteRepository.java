package pl.ttrpgassistant.backend.notes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserNoteRepository extends JpaRepository<UserNoteEntity, Long> {
    List<UserNoteEntity> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<UserNoteEntity> findByIdAndUserId(Long id, Long userId);
}
