package pl.ttrpgassistant.backend.messages;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByConversationIdOrderByIdDesc(Long conversationId, Pageable pageable);

    List<MessageEntity> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long beforeId, Pageable pageable);

    Optional<MessageEntity> findTopByConversationIdOrderByIdDesc(Long conversationId);

    long countByConversationIdAndSenderUserIdNot(Long conversationId, Long userId);

    long countByConversationIdAndIdGreaterThanAndSenderUserIdNot(Long conversationId, Long afterId, Long userId);

    @Query("""
            select m
            from MessageEntity m
            where m.conversationId = :conversationId
              and m.id in :ids
            """)
    List<MessageEntity> findByConversationIdAndIds(
            @Param("conversationId") Long conversationId,
            @Param("ids") List<Long> ids
    );
}
