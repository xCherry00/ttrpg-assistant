package pl.ttrpgassistant.backend.character;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerCharacterRepository extends JpaRepository<PlayerCharacterEntity, Long> {

    List<PlayerCharacterEntity> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);

    Optional<PlayerCharacterEntity> findByIdAndOwnerUserId(Long id, Long ownerUserId);
}
