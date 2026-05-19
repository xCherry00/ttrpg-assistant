package pl.ttrpgassistant.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pl.ttrpgassistant.backend.auth.dto.AuthResponse;
import pl.ttrpgassistant.backend.auth.dto.LoginRequest;
import pl.ttrpgassistant.backend.auth.dto.RegisterRequest;

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

    private String clientKey(HttpServletRequest request, String email) {
        String ip = request.getRemoteAddr();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        return ip + ":" + normalizedEmail;
    }
}
