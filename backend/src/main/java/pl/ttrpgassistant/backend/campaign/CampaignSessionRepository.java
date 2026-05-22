package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CampaignSessionRepository extends JpaRepository<CampaignSessionEntity, Long> {

    List<CampaignSessionEntity> findByCampaignIdOrderByCreatedAtDesc(Long campaignId);

    Optional<CampaignSessionEntity> findTopByCampaignIdAndStatusOrderByFinishedAtDescUpdatedAtDesc(Long campaignId, String status);

    Optional<CampaignSessionEntity> findByIdAndCampaignId(Long id, Long campaignId);

    List<CampaignSessionEntity> findByCampaignIdInAndStatusOrderByFinishedAtDescUpdatedAtDesc(Collection<Long> campaignIds, String status);
}
