package pl.ttrpgassistant.backend.common.error;

/**
 * Thrown when attempting to create a resource that already exists (uniqueness violation)
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause);
    }
}
