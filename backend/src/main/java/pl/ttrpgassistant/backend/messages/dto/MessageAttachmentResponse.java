package pl.ttrpgassistant.backend.messages.dto;

public record MessageAttachmentResponse(
        long id,
        String originalName,
        String mimeType,
        long sizeBytes,
        String url
) {
}
