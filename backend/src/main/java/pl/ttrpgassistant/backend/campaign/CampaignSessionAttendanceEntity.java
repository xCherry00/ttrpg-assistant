package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "campaign_session_attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignSessionAttendanceEntity {

    @EmbeddedId
    private CampaignSessionAttendanceId id;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "MAYBE";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
