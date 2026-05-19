package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiceRollRepository extends JpaRepository<DiceRollEntity, Long> {

    @Query("""
            select r from DiceRollEntity r
            where r.campaignId = :campaignId
              and r.deletedAt is null
              and (:sessionId is null or r.sessionId = :sessionId)
              and (:encounterId is null or r.encounterId = :encounterId)
              and (:characterId is null or r.characterId = :characterId)
            order by r.createdAt desc
            """)
    List<DiceRollEntity> findForCampaignFilters(
            @Param("campaignId") Long campaignId,
            @Param("sessionId") Long sessionId,
            @Param("encounterId") Long encounterId,
            @Param("characterId") Long characterId
    );

    Optional<DiceRollEntity> findByIdAndCampaignIdAndDeletedAtIsNull(Long id, Long campaignId);
}
