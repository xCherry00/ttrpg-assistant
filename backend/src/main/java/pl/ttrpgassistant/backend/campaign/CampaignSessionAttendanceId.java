package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CampaignSessionAttendanceId implements Serializable {

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "user_id")
    private Long userId;
}
