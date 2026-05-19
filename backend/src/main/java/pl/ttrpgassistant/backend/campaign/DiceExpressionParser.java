package pl.ttrpgassistant.backend.campaign;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DiceExpressionParser {

    private static final Pattern BASIC_PATTERN = Pattern.compile("^\\s*(?:(\\d{0,2})d(\\d{1,4}))(?:\\s*([+-])\\s*(\\d{1,4}))?\\s*$", Pattern.CASE_INSENSITIVE);

    private final DiceRandomSource randomSource;

    public DiceExpressionParser(DiceRandomSource randomSource) {
        this.randomSource = randomSource;
    }

    public DiceRollComputation parseAndRoll(String expression) {
        Matcher matcher = BASIC_PATTERN.matcher(expression == null ? "" : expression.trim());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Unsupported dice expression. Use format like d20, 2d6+3, 1d20-1.");
        }

        String rawCount = matcher.group(1);
        int count = rawCount == null || rawCount.isBlank() ? 1 : Integer.parseInt(rawCount);
        int sides = Integer.parseInt(matcher.group(2));
        String sign = matcher.group(3);
        String rawModifier = matcher.group(4);
        int modifier = rawModifier == null ? 0 : Integer.parseInt(rawModifier) * ("-".equals(sign) ? -1 : 1);

        if (count < 1 || count > 20) {
            throw new IllegalArgumentException("Dice count must be between 1 and 20.");
        }
        if (sides < 2 || sides > 1000) {
            throw new IllegalArgumentException("Die size must be between d2 and d1000.");
        }
        if (modifier < -1000 || modifier > 1000) {
            throw new IllegalArgumentException("Modifier must be between -1000 and 1000.");
        }

        List<Integer> values = new ArrayList<>(count);
        int sum = 0;
        for (int i = 0; i < count; i++) {
            int roll = randomSource.roll(sides);
            values.add(roll);
            sum += roll;
        }
        int total = sum + modifier;

        String normalizedExpression = count + "d" + sides + (modifier == 0 ? "" : (modifier > 0 ? "+" : "") + modifier);
        String diceResults = "{\"dice\":\"" + count + "d" + sides + "\",\"values\":" + values + ",\"modifier\":" + modifier + ",\"total\":" + total + "}";

        return new DiceRollComputation(normalizedExpression, count, sides, modifier, values, total, diceResults);
    }

    public record DiceRollComputation(
            String normalizedExpression,
            int count,
            int sides,
            int modifier,
            List<Integer> values,
            int total,
            String diceResults
    ) {}
}
