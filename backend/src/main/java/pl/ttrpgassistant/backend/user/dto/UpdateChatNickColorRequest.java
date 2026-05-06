package pl.ttrpgassistant.backend.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateChatNickColorRequest(
        @Size(max = 20)
        @Pattern(regexp = "^$|^#[0-9A-Fa-f]{6}$", message = "chatNickColor must be empty or a hex color like #AABBCC")
        String chatNickColor
) {}
