package pl.ttrpgassistant.backend.common.error;

import java.time.OffsetDateTime;

public record ApiError(
        String message,
        OffsetDateTime timestamp
) {}
