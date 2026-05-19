package pl.ttrpgassistant.backend.campaign;

import org.junit.jupiter.api.Test;

import java.util.ArrayDeque;
import java.util.Queue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiceExpressionParserTest {

    @Test
    void shouldParseSupportedExpressions() {
        DiceExpressionParser parser = new DiceExpressionParser(sequenceRandom(20, 3, 5, 1, 42));

        var d20 = parser.parseAndRoll("d20");
        assertThat(d20.total()).isEqualTo(20);

        var d2d6plus3 = parser.parseAndRoll("2d6+3");
        assertThat(d2d6plus3.total()).isEqualTo(11);

        var d1d20minus1 = parser.parseAndRoll("1d20-1");
        assertThat(d1d20minus1.total()).isEqualTo(0);

        var d100 = parser.parseAndRoll("d100");
        assertThat(d100.total()).isEqualTo(42);
    }

    @Test
    void shouldRejectInvalidOrOutOfRangeExpressions() {
        DiceExpressionParser parser = new DiceExpressionParser(sequenceRandom(1));

        assertThatThrownBy(() -> parser.parseAndRoll("1d20+2d6"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> parser.parseAndRoll("21d6"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Dice count");
        assertThatThrownBy(() -> parser.parseAndRoll("1d1001"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Die size");
        assertThatThrownBy(() -> parser.parseAndRoll("1d20+1001"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Modifier");
    }

    private DiceRandomSource sequenceRandom(int... values) {
        Queue<Integer> queue = new ArrayDeque<>();
        for (int value : values) {
            queue.add(value);
        }
        return sides -> {
            if (queue.isEmpty()) {
                return 1;
            }
            int next = queue.remove();
            if (next < 1 || next > sides) {
                return 1;
            }
            return next;
        };
    }
}
