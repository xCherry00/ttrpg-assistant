package pl.ttrpgassistant.backend.generator;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GeneratorResultRepository extends JpaRepository<GeneratorResultEntity, Long> {
    List<GeneratorResultEntity> findTop10ByOrderByCreatedAtDesc();

    @Modifying
    @Query("update GeneratorResultEntity result set result.campaignId = null where result.campaignId = :campaignId")
    int detachCampaign(@Param("campaignId") Long campaignId);
}
