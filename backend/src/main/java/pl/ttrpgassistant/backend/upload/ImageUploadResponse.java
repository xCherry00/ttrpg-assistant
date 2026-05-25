package pl.ttrpgassistant.backend.upload;

public record ImageUploadResponse(
        String fileName,
        String url,
        String contentType,
        long size
) {}
