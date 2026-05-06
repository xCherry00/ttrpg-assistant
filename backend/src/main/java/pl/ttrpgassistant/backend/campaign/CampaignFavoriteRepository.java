package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignFavoriteRepository extends JpaRepository<CampaignFavoriteEntity, CampaignFavoriteId> {
    List<CampaignFavoriteEntity> findByIdUserId(Long userId);
}
