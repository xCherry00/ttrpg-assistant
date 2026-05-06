package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignSessionNoteRepository extends JpaRepository<CampaignSessionNoteEntity, Long> {
}
