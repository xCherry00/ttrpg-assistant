package pl.ttrpgassistant.backend.upload;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {
    private final ImageUploadService imageUploadService;

    @PostMapping("/images")
    public ImageUploadResponse uploadImage(
            Authentication auth,
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file
    ) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalArgumentException("Authentication is required.");
        }
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        return imageUploadService.upload(file, baseUrl);
    }
}
