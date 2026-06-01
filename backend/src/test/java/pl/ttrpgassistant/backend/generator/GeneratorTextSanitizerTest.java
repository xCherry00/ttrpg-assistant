package pl.ttrpgassistant.backend.generator;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeneratorTextSanitizerTest {

    @Test
    void cleansDoubleEncodedPolishCharactersFromGeneratorText() {
        String broken = "Ă„Ä…ÄąË‡mieje siÄ‚â€žĂ˘â€žË tylko wtedy, gdy sytuacja robi siÄ‚â€žĂ˘â€žË zĂ„Ä…Ă˘â‚¬Ĺˇa";

        assertThat(GeneratorTextSanitizer.clean(broken))
                .isEqualTo("Śmieje się tylko wtedy, gdy sytuacja robi się zła");
    }

    @Test
    void cleansCommonNpcAndFantasyArtifacts() {
        String broken = "CzĂ„Ä…Ă˘â‚¬Ĺˇowiek, PĂ„â€šÄąâ€šĂ„Ä…Ă˘â‚¬Ĺˇelf, ÄąÂup i PrzysiÄ‚â€žĂ˘â€žËga";

        assertThat(GeneratorTextSanitizer.clean(broken))
                .isEqualTo("Człowiek, Półelf, Łup i Przysięga");
    }

    @Test
    void keepsCleanTextUnchanged() {
        assertThat(GeneratorTextSanitizer.clean("Brak wymaganych rzutów."))
                .isEqualTo("Brak wymaganych rzutów.");
    }
}
