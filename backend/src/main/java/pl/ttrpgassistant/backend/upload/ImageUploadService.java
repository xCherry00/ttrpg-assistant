package pl.ttrpgassistant.backend.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        byte[] bytes = readBytes(file);
        if (!matchesRealImageType(bytes, contentType)) {
            throw new IllegalArgumentException("Uploaded file is not a valid JPEG, PNG or WEBP image.");
        }

        String extension = extensionFor(contentType);
        String safeFileName = UUID.randomUUID() + extension;
        Path root = Paths.get(imageUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
            Path target = root.resolve(safeFileName).normalize();
            Files.write(target, bytes);
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

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Could not read uploaded image.");
        }
    }

    private boolean matchesRealImageType(byte[] bytes, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> isJpeg(bytes);
            case "image/png" -> isPng(bytes);
            case "image/webp" -> isWebp(bytes);
            default -> false;
        };
    }

    private boolean isJpeg(byte[] bytes) {
        return bytes.length >= 3
                && (bytes[0] & 0xff) == 0xff
                && (bytes[1] & 0xff) == 0xd8
                && (bytes[2] & 0xff) == 0xff;
    }

    private boolean isPng(byte[] bytes) {
        byte[] signature = new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        if (bytes.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (bytes[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private boolean isWebp(byte[] bytes) {
        return bytes.length >= 12
                && bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P';
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
