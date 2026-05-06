package pl.ttrpgassistant.backend.messages;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pl.ttrpgassistant.backend.messages.dto.CreateMessageRequest;
import pl.ttrpgassistant.backend.messages.dto.MessageConversationSummaryResponse;
import pl.ttrpgassistant.backend.messages.dto.MessageResponse;
import pl.ttrpgassistant.backend.messages.dto.MessageUnreadCountResponse;
import pl.ttrpgassistant.backend.common.pagination.PagedResponse;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/conversations")
    public PagedResponse<MessageConversationSummaryResponse> listConversations(
            Authentication auth,
            @RequestParam(defaultValue = "all") String filter,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Long userId = (Long) auth.getPrincipal();
        return PagedResponse.of(messageService.listConversations(userId, filter), page, size);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageResponse> listMessages(
            Authentication auth,
            @PathVariable Long conversationId,
            @RequestParam(required = false) Long beforeId,
            @RequestParam(defaultValue = "40") Integer limit
    ) {
        Long userId = (Long) auth.getPrincipal();
        return messageService.listMessages(userId, conversationId, beforeId, limit);
    }

    @PostMapping("/direct/{targetUserId}")
    public MessageConversationSummaryResponse startDirectConversation(Authentication auth, @PathVariable Long targetUserId) {
        Long userId = (Long) auth.getPrincipal();
        return messageService.startOrGetDirectConversation(userId, targetUserId);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public MessageResponse sendTextMessage(
            Authentication auth,
            @PathVariable Long conversationId,
            @Valid @RequestBody CreateMessageRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return messageService.sendMessage(userId, conversationId, request.content(), List.of());
    }

    @PostMapping(value = "/conversations/{conversationId}/messages-with-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MessageResponse sendMessageWithFiles(
            Authentication auth,
            @PathVariable Long conversationId,
            @RequestParam(required = false, defaultValue = "") String content,
            @RequestParam(name = "files", required = false) List<MultipartFile> files
    ) {
        Long userId = (Long) auth.getPrincipal();
        return messageService.sendMessage(userId, conversationId, content, files == null ? List.of() : files);
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable Long conversationId) {
        Long userId = (Long) auth.getPrincipal();
        messageService.markConversationRead(userId, conversationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/conversations/{conversationId}/accept")
    public ResponseEntity<Void> acceptRequest(Authentication auth, @PathVariable Long conversationId) {
        Long userId = (Long) auth.getPrincipal();
        messageService.acceptConversationRequest(userId, conversationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/conversations/{conversationId}/reject")
    public ResponseEntity<Void> rejectRequest(Authentication auth, @PathVariable Long conversationId) {
        Long userId = (Long) auth.getPrincipal();
        messageService.rejectConversationRequest(userId, conversationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unread-count")
    public MessageUnreadCountResponse unreadCount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return messageService.getUnreadCount(userId);
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(Authentication auth, @PathVariable Long attachmentId) {
        Long userId = (Long) auth.getPrincipal();
        MessageAttachmentEntity attachment = messageService.getAttachmentEntity(attachmentId);
        Resource resource = messageService.downloadAttachment(userId, attachmentId);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(attachment.getMimeType());
        } catch (Exception ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getOriginalName() + "\"")
                .body(resource);
    }
}
