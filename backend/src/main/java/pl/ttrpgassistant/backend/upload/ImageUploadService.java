package pl.ttrpgassistant.backend.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageUploadService {
    private static final long MAX_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    @Value("${app.uploads.imagesDir:uploads/images}")
    private String imageUploadDir;

    public ImageUploadResponse upload(MultipartFile file, String baseUrl) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required.");
        }

        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type. Allowed: JPEG, PNG, WEBP.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Image is too large. Maximum size is 5 MB.");
        }

        String extension = extensionFor(contentType);
        String safeFileName = UUID.randomUUID() + extension;
        Path root = Paths.get(imageUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
            Path target = root.resolve(safeFileName).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return new ImageUploadResponse(
                    safeFileName,
                    baseUrl + "/uploads/images/" + safeFileName,
                    contentType,
                    file.getSize()
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Could not save uploaded image.", ex);
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) return "";
        return contentType.trim().toLowerCase(Locale.ROOT);
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> "";
        };
    }
}
