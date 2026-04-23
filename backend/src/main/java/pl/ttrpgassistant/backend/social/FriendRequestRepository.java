package pl.ttrpgassistant.backend.social;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequestEntity, Long> {

    List<FriendRequestEntity> findByReceiverUserIdAndStatusOrderByCreatedAtDesc(Long receiverUserId, FriendRequestStatus status);
    List<FriendRequestEntity> findBySenderUserIdAndStatusOrderByCreatedAtDesc(Long senderUserId, FriendRequestStatus status);
    Optional<FriendRequestEntity> findByIdAndReceiverUserIdAndStatus(Long id, Long receiverUserId, FriendRequestStatus status);
    Optional<FriendRequestEntity> findByIdAndSenderUserIdAndStatus(Long id, Long senderUserId, FriendRequestStatus status);
    Optional<FriendRequestEntity> findTopBySenderUserIdAndReceiverUserIdAndStatusOrderByCreatedAtDesc(Long senderUserId, Long receiverUserId, FriendRequestStatus status);
    List<FriendRequestEntity> findBySenderUserIdAndReceiverUserIdAndStatus(Long senderUserId, Long receiverUserId, FriendRequestStatus status);
    List<FriendRequestEntity> findByReceiverUserIdAndSenderUserIdAndStatus(Long receiverUserId, Long senderUserId, FriendRequestStatus status);
}
