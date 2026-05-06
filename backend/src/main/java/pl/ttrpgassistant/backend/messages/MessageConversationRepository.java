package pl.ttrpgassistant.backend.messages;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MessageConversationRepository extends JpaRepository<MessageConversationEntity, Long> {

    Optional<MessageConversationEntity> findByDirectKey(String directKey);
}
