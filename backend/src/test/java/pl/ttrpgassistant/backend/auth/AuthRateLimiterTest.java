package pl.ttrpgassistant.backend.auth;

import org.junit.jupiter.api.Test;
import pl.ttrpgassistant.backend.common.error.RateLimitExceededException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthRateLimiterTest {

    @Test
    void shouldBoundTrackedClientKeys() {
        AuthRateLimiter limiter = new AuthRateLimiter();

        for (int i = 0; i < 10_000; i++) {
            limiter.checkLogin("127.0.0.1:user-" + i + "@example.com");
        }

        assertThatThrownBy(() -> limiter.checkLogin("127.0.0.1:overflow@example.com"))
                .isInstanceOf(RateLimitExceededException.class);
    }
}
