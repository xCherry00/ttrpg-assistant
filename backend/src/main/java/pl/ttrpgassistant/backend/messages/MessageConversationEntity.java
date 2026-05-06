package pl.ttrpgassistant.backend.messages;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "dm_conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageConversationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    @Builder.Default
    private MessageConversationType type = MessageConversationType.DIRECT;

    @Column(name = "direct_key", length = 80)
    private String directKey;

    @Column(name = "title", nullable = false, length = 180)
    @Builder.Default
    private String title = "";

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "last_message_preview", nullable = false, length = 280)
    @Builder.Default
    private String lastMessagePreview = "";

    @Column(name = "last_message_sender_user_id")
    private Long lastMessageSenderUserId;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
