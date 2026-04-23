package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignMaterialRepository extends JpaRepository<CampaignMaterialEntity, Long> {

    List<CampaignMaterialEntity> findByCampaignIdOrderByUpdatedAtDescCreatedAtDesc(Long campaignId);
}
