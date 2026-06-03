package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CampaignCharacterRepository extends JpaRepository<CampaignCharacterEntity, CampaignCharacterId> {

    List<CampaignCharacterEntity> findByIdCampaignIdAndActiveTrueOrderByAssignedAtAsc(Long campaignId);

    List<CampaignCharacterEntity> findByIdCampaignIdAndUserIdNotOrderByAssignedAtAsc(Long campaignId, Long userId);

    Optional<CampaignCharacterEntity> findByIdCampaignIdAndIdCharacterId(Long campaignId, Long characterId);

    boolean existsByIdCampaignIdAndIdCharacterIdAndActiveTrue(Long campaignId, Long characterId);

    @Query("select count(c) > 0 from CampaignCharacterEntity c where c.id.characterId = :characterId and c.active = true")
    boolean existsActiveByCharacterId(@Param("characterId") Long characterId);
}
