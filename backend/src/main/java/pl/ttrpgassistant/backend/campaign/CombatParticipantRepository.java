package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CombatParticipantRepository extends JpaRepository<CombatParticipantEntity, Long> {

    List<CombatParticipantEntity> findByEncounterId(Long encounterId);
}
