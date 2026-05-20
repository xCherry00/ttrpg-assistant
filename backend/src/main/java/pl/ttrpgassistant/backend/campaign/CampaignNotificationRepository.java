package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampaignNotificationRepository extends JpaRepository<CampaignNotificationEntity, Long> {

    List<CampaignNotificationEntity> findTop20ByUserIdAndCampaignIdOrderByCreatedAtDesc(Long userId, Long campaignId);

    List<CampaignNotificationEntity> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadAtIsNull(Long userId);

    Optional<CampaignNotificationEntity> findByIdAndUserId(Long id, Long userId);

    List<CampaignNotificationEntity> findByUserIdAndReadAtIsNull(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);
}
