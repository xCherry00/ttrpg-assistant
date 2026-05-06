package pl.ttrpgassistant.backend.messages;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface MessageAttachmentRepository extends JpaRepository<MessageAttachmentEntity, Long> {

    List<MessageAttachmentEntity> findByMessageIdOrderByIdAsc(Long messageId);

    @Query("""
            select a
            from MessageAttachmentEntity a
            where a.messageId in :messageIds
            order by a.messageId asc, a.id asc
            """)
    List<MessageAttachmentEntity> findByMessageIds(
            @Param("messageIds") Collection<Long> messageIds
    );
}
