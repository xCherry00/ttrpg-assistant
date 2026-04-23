package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignSessionAttendanceRepository extends JpaRepository<CampaignSessionAttendanceEntity, CampaignSessionAttendanceId> {

    List<CampaignSessionAttendanceEntity> findByIdSessionId(Long sessionId);
}
