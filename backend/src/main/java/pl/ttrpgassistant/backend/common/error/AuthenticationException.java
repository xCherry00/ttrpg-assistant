package pl.ttrpgassistant.backend.common.error;

/**
 * Thrown when authentication fails (invalid credentials, user not found, etc.)
 */
public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
