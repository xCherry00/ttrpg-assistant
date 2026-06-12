package pl.ttrpgassistant.backend.auth;

import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.common.error.RateLimitExceededException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthRateLimiter {

    private final Map<String, Deque<Instant>> attemptsByKey = new ConcurrentHashMap<>();

    public void checkLogin(String clientKey) {
        check("login:" + clientKey, 10, Duration.ofMinutes(1), "Za dużo prób logowania. Spróbuj ponownie za chwilę.");
    }

    public void checkRegister(String clientKey) {
        check("register:" + clientKey, 5, Duration.ofMinutes(5), "Za dużo prób rejestracji. Spróbuj ponownie za kilka minut.");
    }

    public void checkPasswordResetRequest(String clientKey) {
        check("password-reset-request:" + clientKey, 3, Duration.ofMinutes(10), "Za dużo prób resetowania hasła. Spróbuj ponownie za kilka minut.");
    }

    public void checkPasswordResetConfirm(String clientKey) {
        check("password-reset-confirm:" + clientKey, 10, Duration.ofMinutes(10), "Za dużo prób ustawienia nowego hasła. Spróbuj ponownie za kilka minut.");
    }

    private void check(String key, int maxAttempts, Duration window, String message) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> attempts = attemptsByKey.computeIfAbsent(key, ignored -> new ArrayDeque<>());

        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
                attempts.removeFirst();
            }
            if (attempts.size() >= maxAttempts) {
                throw new RateLimitExceededException(message);
            }
            attempts.addLast(now);
        }
    }
}
