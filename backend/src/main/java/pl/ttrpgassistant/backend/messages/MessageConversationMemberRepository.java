package pl.ttrpgassistant.backend.messages;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageConversationMemberRepository extends JpaRepository<MessageConversationMemberEntity, MessageConversationMemberId> {

    @Query("""
            select m
            from MessageConversationMemberEntity m, MessageConversationEntity c
            where m.id.conversationId = c.id
              and m.id.userId = :userId
              and m.status in :statuses
            order by coalesce(c.lastMessageAt, c.createdAt) desc
            """)
    List<MessageConversationMemberEntity> findForUserByStatuses(
            @Param("userId") Long userId,
            @Param("statuses") Collection<MessageMemberStatus> statuses
    );

    List<MessageConversationMemberEntity> findByIdConversationId(Long conversationId);

    @Query("""
            select m
            from MessageConversationMemberEntity m
            where m.id.conversationId in :conversationIds
            """)
    List<MessageConversationMemberEntity> findByConversationIds(
            @Param("conversationIds") Collection<Long> conversationIds
    );

    Optional<MessageConversationMemberEntity> findByIdConversationIdAndIdUserId(Long conversationId, Long userId);
}
