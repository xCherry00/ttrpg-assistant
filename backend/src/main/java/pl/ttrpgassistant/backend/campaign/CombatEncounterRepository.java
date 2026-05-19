package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CombatEncounterRepository extends JpaRepository<CombatEncounterEntity, Long> {

    List<CombatEncounterEntity> findByCampaignIdAndDeletedAtIsNullOrderByUpdatedAtDescCreatedAtDesc(Long campaignId);

    Optional<CombatEncounterEntity> findByIdAndCampaignIdAndDeletedAtIsNull(Long id, Long campaignId);
}
