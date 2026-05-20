package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignPlayerNoteRepository extends JpaRepository<CampaignPlayerNoteEntity, Long> {
    List<CampaignPlayerNoteEntity> findByCampaignIdOrderByUpdatedAtDesc(Long campaignId);
    List<CampaignPlayerNoteEntity> findByCampaignIdAndUserIdOrderByUpdatedAtDesc(Long campaignId, Long userId);
}
