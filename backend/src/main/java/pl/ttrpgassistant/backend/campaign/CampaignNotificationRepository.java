package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignNotificationRepository extends JpaRepository<CampaignNotificationEntity, Long> {

    List<CampaignNotificationEntity> findTop20ByUserIdAndCampaignIdOrderByCreatedAtDesc(Long userId, Long campaignId);
}
