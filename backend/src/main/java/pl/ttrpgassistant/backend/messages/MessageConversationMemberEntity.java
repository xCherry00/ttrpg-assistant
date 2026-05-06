package pl.ttrpgassistant.backend.messages;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "dm_conversation_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageConversationMemberEntity {

    @EmbeddedId
    private MessageConversationMemberId id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MessageMemberStatus status = MessageMemberStatus.ACTIVE;

    @Column(name = "muted", nullable = false)
    @Builder.Default
    private boolean muted = false;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }
}
