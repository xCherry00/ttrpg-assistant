package pl.ttrpgassistant.backend.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Locale;
import java.util.regex.Pattern;

public class SafeImageOrHttpUrlValidator implements ConstraintValidator<SafeImageOrHttpUrl, String> {

    private static final Pattern HTTP_URL = Pattern.compile("^https?://.+", Pattern.CASE_INSENSITIVE);
    private static final Pattern DATA_IMAGE = Pattern.compile("^data:image/(png|jpeg|svg\\+xml);base64,.+", Pattern.CASE_INSENSITIVE);

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) return true;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return true;

        String normalized = trimmed.toLowerCase(Locale.ROOT);
        if (normalized.startsWith("javascript:")) return false;

        return HTTP_URL.matcher(trimmed).matches() || DATA_IMAGE.matcher(trimmed).matches();
    }
}
