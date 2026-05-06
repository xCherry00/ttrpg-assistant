package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignSessionMessageRepository extends JpaRepository<CampaignSessionMessageEntity, Long> {

    List<CampaignSessionMessageEntity> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
