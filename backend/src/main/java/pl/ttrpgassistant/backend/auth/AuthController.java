package pl.ttrpgassistant.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.ttrpgassistant.backend.auth.dto.AuthResponse;
import pl.ttrpgassistant.backend.auth.dto.ForgotPasswordRequest;
import pl.ttrpgassistant.backend.auth.dto.ForgotPasswordResponse;
import pl.ttrpgassistant.backend.auth.dto.LoginRequest;
import pl.ttrpgassistant.backend.auth.dto.RegisterRequest;
import pl.ttrpgassistant.backend.auth.dto.ResetPasswordRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthRateLimiter authRateLimiter;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        authRateLimiter.checkRegister(clientKey(request, req.email()));
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        authRateLimiter.checkLogin(clientKey(request, req.email()));
        return authService.login(req);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        return ResponseEntity.ok(authService.forgotPassword(req));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.noContent().build();
    }

    private String clientKey(HttpServletRequest request, String email) {
        String ip = request.getRemoteAddr();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        return ip + ":" + normalizedEmail;
    }
}
