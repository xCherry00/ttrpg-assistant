package pl.ttrpgassistant.backend.campaign;

import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class ThreadLocalDiceRandomSource implements DiceRandomSource {
    @Override
    public int roll(int sides) {
        return ThreadLocalRandom.current().nextInt(1, sides + 1);
    }
}
