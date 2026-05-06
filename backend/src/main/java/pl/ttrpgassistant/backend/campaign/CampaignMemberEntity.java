package pl.ttrpgassistant.backend.campaign;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "campaign_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignMemberEntity {

    @EmbeddedId
    private CampaignMemberId id;

    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private String role = "player";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
