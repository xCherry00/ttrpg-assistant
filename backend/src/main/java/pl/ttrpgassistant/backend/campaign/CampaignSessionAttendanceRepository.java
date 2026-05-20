package pl.ttrpgassistant.backend.campaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampaignSessionAttendanceRepository extends JpaRepository<CampaignSessionAttendanceEntity, Long> {

    List<CampaignSessionAttendanceEntity> findBySessionId(Long sessionId);

    List<CampaignSessionAttendanceEntity> findBySessionIdIn(List<Long> sessionIds);

    Optional<CampaignSessionAttendanceEntity> findBySessionIdAndUserId(Long sessionId, Long userId);

    void deleteBySessionIdAndUserId(Long sessionId, Long userId);
}
