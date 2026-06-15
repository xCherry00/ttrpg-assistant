package pl.ttrpgassistant.backend.generator;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

final class GeneratorTextSanitizer {
    private static final Charset WINDOWS_1250 = Charset.forName("windows-1250");
    private static final Map<String, String> COMMON_MOJIBAKE = commonMojibake();
    private static final Map<String, String> COMMON_ASCII_POLISH = commonAsciiPolish();

    private GeneratorTextSanitizer() {
    }

    static String clean(Object value) {
        if (value == null) {
            return "";
        }

        String text = String.valueOf(value);
        String repaired = repairMojibake(text);
        return finish(repaired);
    }

    private static String repairMojibake(String text) {
        String best = replaceKnownArtifacts(text);
        int bestScore = mojibakeScore(best);

        for (int i = 0; i < 3 && bestScore > 0; i++) {
            String decodedWindows = replaceKnownArtifacts(decodeAsUtf8(best, WINDOWS_1250));
            int windowsScore = mojibakeScore(decodedWindows);
            if (windowsScore < bestScore) {
                best = decodedWindows;
                bestScore = windowsScore;
                continue;
            }

            String decodedLatin = replaceKnownArtifacts(decodeAsUtf8(best, StandardCharsets.ISO_8859_1));
            int latinScore = mojibakeScore(decodedLatin);
            if (latinScore < bestScore) {
                best = decodedLatin;
                bestScore = latinScore;
                continue;
            }

            break;
        }

        return best;
    }

    private static String decodeAsUtf8(String text, Charset sourceCharset) {
        try {
            return new String(text.getBytes(sourceCharset), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            return text;
        }
    }

    private static String replaceKnownArtifacts(String text) {
        String repaired = text == null ? "" : text;
        for (Map.Entry<String, String> entry : COMMON_MOJIBAKE.entrySet()) {
            repaired = repaired.replace(entry.getKey(), entry.getValue());
        }
        return repaired;
    }

    private static int mojibakeScore(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        int score = 0;
        String markers = "ĂÄĹÂÃ�";
        for (int i = 0; i < text.length(); i++) {
            if (markers.indexOf(text.charAt(i)) >= 0) {
                score++;
            }
        }
        return score;
    }

    private static String finish(String text) {
        String polished = replaceCommonAsciiPolish(text == null ? "" : text)
                .replaceAll("\\s{2,}", " ")
                .trim();
        if (polished.isBlank()) {
            return polished;
        }

        int firstLetter = -1;
        for (int i = 0; i < polished.length(); i++) {
            if (Character.isLetter(polished.charAt(i))) {
                firstLetter = i;
                break;
            }
        }
        if (firstLetter < 0) {
            return polished;
        }

        char current = polished.charAt(firstLetter);
        char upper = Character.toUpperCase(current);
        if (current == upper) {
            return polished;
        }
        return polished.substring(0, firstLetter) + upper + polished.substring(firstLetter + 1);
    }

    private static String replaceCommonAsciiPolish(String text) {
        String repaired = text;
        for (Map.Entry<String, String> entry : COMMON_ASCII_POLISH.entrySet()) {
            repaired = repaired.replace(entry.getKey(), entry.getValue());
        }
        return repaired;
    }

    private static Map<String, String> commonMojibake() {
        Map<String, String> map = new LinkedHashMap<>();

        map.put("â€”", "-");
        map.put("â€“", "-");
        map.put("â€ž", "\"");
        map.put("â€ś", "\"");
        map.put("â€ť", "\"");
        map.put("â€™", "'");
        map.put("Â ", " ");

        map.put("Ä…", "ą");
        map.put("Ä‡", "ć");
        map.put("Ä™", "ę");
        map.put("Ĺ‚", "ł");
        map.put("Ĺ„", "ń");
        map.put("Ăł", "ó");
        map.put("Ĺ›", "ś");
        map.put("Ĺş", "ź");
        map.put("ĹĽ", "ż");
        map.put("Äą", "Ł");
        map.put("Ĺ", "Ł");
        map.put("Ĺš", "Ś");
        map.put("Ĺ»", "Ż");
        map.put("Ĺą", "Ź");

        return map;
    }

    private static Map<String, String> commonAsciiPolish() {
        Map<String, String> map = new LinkedHashMap<>();

        map.put("Mozliwy", "Możliwy");
        map.put("Mozliwa", "Możliwa");
        map.put("Mozliwe", "Możliwe");
        map.put("mozliwy", "możliwy");
        map.put("mozliwa", "możliwa");
        map.put("mozliwe", "możliwe");
        map.put("moze", "może");
        map.put("Moze", "Może");
        map.put("mozna", "można");
        map.put("Mozna", "Można");

        map.put("ktory", "który");
        map.put("ktora", "która");
        map.put("ktore", "które");
        map.put("ktorzy", "którzy");
        map.put("ktorego", "którego");
        map.put("ktorej", "której");
        map.put("ktorych", "których");

        map.put("uzyc", "użyć");
        map.put("Uzyc", "Użyć");
        map.put("uzywa", "używa");
        map.put("uzycie", "użycie");
        map.put("Uzycie", "Użycie");
        map.put("uzyteczny", "użyteczny");
        map.put("Uzyteczny", "Użyteczny");

        map.put("druzyna", "drużyna");
        map.put("Druzyna", "Drużyna");
        map.put("druzyny", "drużyny");
        map.put("druzynie", "drużynie");
        map.put("postac", "postać");
        map.put("Postac", "Postać");
        map.put("postaciami", "postaciami");

        map.put("wlasciciel", "właściciel");
        map.put("Wlasciciel", "Właściciel");
        map.put("wlasciciela", "właściciela");
        map.put("wlascicieli", "właścicieli");
        map.put("wlasnosc", "własność");
        map.put("wlasnoscia", "własnością");
        map.put("wlasna", "własną");
        map.put("wlasnym", "własnym");
        map.put("wlasnie", "właśnie");
        map.put("wlasciwy", "właściwy");
        map.put("wlasciwym", "właściwym");

        map.put("zrodlo", "źródło");
        map.put("Zrodlo", "Źródło");
        map.put("zrodla", "źródła");
        map.put("zrodle", "źródle");
        map.put("slad", "ślad");
        map.put("Slad", "Ślad");
        map.put("slady", "ślady");
        map.put("sladow", "śladów");
        map.put("slabosc", "słabość");
        map.put("Slabosc", "Słabość");
        map.put("slowa", "słowa");
        map.put("glos", "głos");
        map.put("glosnych", "głośnych");

        map.put("swiatlo", "światło");
        map.put("swiat", "świat");
        map.put("Swiat", "Świat");
        map.put("swiata", "świata");
        map.put("swiatem", "światem");
        map.put("swiet", "święt");
        map.put("swieta", "święta");

        map.put("mieszkancy", "mieszkańcy");
        map.put("mieszkancow", "mieszkańców");
        map.put("mieszkancami", "mieszkańcami");
        map.put("wladza", "władza");
        map.put("wladzy", "władzy");
        map.put("wladca", "władca");
        map.put("droge", "drogę");
        map.put("prawde", "prawdę");
        map.put("cene", "cenę");
        map.put("czegos", "czegoś");
        map.put("kogos", "kogoś");
        map.put("ktos", "ktoś");
        map.put("Ktos", "Ktoś");
        map.put("jesli", "jeśli");
        map.put("Jesli", "Jeśli");
        map.put("dac", "dać");
        map.put("Dac", "Dać");
        map.put("daje", "daje");
        map.put("zostalo", "zostało");
        map.put("bylo", "było");
        map.put("byc", "być");
        map.put("sa", "są");
        map.put("Sa", "Są");
        map.put("tez", "też");
        map.put("Tez", "Też");

        map.put("pamiec", "pamięć");
        map.put("pamietac", "pamiętać");
        map.put("pamietaja", "pamiętają");
        map.put("zwyciestwo", "zwycięstwo");
        map.put("zaleznosci", "zależności");
        map.put("zaleznosc", "zależność");
        map.put("zdecydowac", "zdecydować");
        map.put("przejac", "przejąć");
        map.put("przysiege", "przysięgę");
        map.put("przyslugi", "przysługi");
        map.put("posrednik", "pośrednik");
        map.put("posrednikow", "pośredników");
        map.put("siec", "sieć");
        map.put("wiekszy", "większy");
        map.put("wiekszym", "większym");
        map.put("zamkniete", "zamknięte");
        map.put("zamkniety", "zamknięty");
        map.put("zagadke", "zagadkę");
        map.put("zmieńic", "zmienić");
        map.put("zmieńia", "zmienia");
        map.put("zmieńil", "zmienił");
        map.put("zmieńilo", "zmieniło");
        map.put("zmieńiła", "zmieniła");
        map.put("zmieńi", "zmieni");
        map.put("Zmieńia", "Zmienia");
        map.put("Zmieńil", "Zmienił");
        map.put("Zmieńilo", "Zmieniło");
        map.put("Zmieńiła", "Zmieniła");
        map.put("pulapka", "pułapka");
        map.put("Pulapka", "Pułapka");
        map.put("Sredni", "Średni");
        map.put("Srednie", "Średnie");
        map.put("Srednia", "Średnia");
        map.put("sredni", "średni");
        map.put("Swiatynia", "Świątynia");
        map.put("Wieza", "Wieża");
        map.put("Mlyn", "Młyn");
        map.put("Ksiezycowy", "Księżycowy");

        map.put(" sie", " się");
        map.put(" Sie", " Się");
        map.put(" ze ", " że ");
        map.put(" Ze ", " Że ");
        map.put(" az ", " aż ");
        map.put(" Az ", " Aż ");
        map.put(" juz", " już");
        map.put(" Juz", " Już");
        map.put(" czyms", " czymś");
        map.put(" Czyms", " Czymś");
        map.put(" czesc", " część");
        map.put(" Czesc", " Część");
        map.put(" czescia", " częścią");
        map.put(" calej", " całej");
        map.put(" cale", " całe");
        map.put(" caly", " cały");
        map.put(" calosc", " całość");
        map.put(" byla", " była");
        map.put(" byl ", " był ");
        map.put(" bylo", " było");
        map.put(" beda", " będą");
        map.put(" bedzie", " będzie");
        map.put(" mial", " miał");
        map.put(" miala", " miała");
        map.put(" mialy", " miały");
        map.put(" da sie", " da się");
        map.put(" nie da sie", " nie da się");
        map.put(" staje sie", " staje się");
        map.put(" zaczyna sie", " zaczyna się");
        map.put(" pojawia sie", " pojawia się");
        map.put(" rozgrywa sie", " rozgrywa się");
        map.put(" trzymaja sie", " trzymają się");
        map.put(" zamykaja sie", " zamykają się");
        map.put(" dziala", " działa");
        map.put(" dzialania", " działania");
        map.put(" dzialac", " działać");
        map.put(" Dziala", " Działa");
        map.put(" srodku", " środku");
        map.put(" srodowisko", " środowisko");
        map.put(" srodowiskiem", " środowiskiem");
        map.put(" srodka", " środka");
        map.put(" wplyw", " wpływ");
        map.put(" wplywami", " wpływami");
        map.put(" wejscie", " wejście");
        map.put(" wejscia", " wejścia");
        map.put(" wyjscie", " wyjście");
        map.put(" wyjscia", " wyjścia");
        map.put(" sciana", " ścianą");
        map.put(" scianie", " ścianie");
        map.put(" podlogi", " podłogi");
        map.put(" posadzka", " posadzką");
        map.put(" sprzet", " sprzęt");
        map.put(" watku", " wątku");
        map.put(" wskazowka", " wskazówka");
        map.put(" prowadzaca", " prowadząca");
        map.put(" droga", " droga");
        map.put(" drog ", " dróg ");
        map.put(" waskie", " wąskie");
        map.put(" Waske", " Wąskie");
        map.put(" wiszace", " wiszące");
        map.put(" spojrzen", " spojrzeń");
        map.put(" zaslon", " zasłon");
        map.put(" gosci", " gości");
        map.put(" goscinni", " gościnni");
        map.put(" milkna", " milkną");
        map.put(" wola", " wolą");
        map.put(" pamietac", " pamiętać");
        map.put(" odslonic", " odsłonić");
        map.put(" wskaze", " wskaże");
        map.put(" stoja", " stoją");
        map.put(" rosnie", " rośnie");
        map.put(" falszuje", " fałszuje");
        map.put(" wladz", " władz");
        map.put(" zamknietych", " zamkniętych");
        map.put(" zwiazana", " związana");
        map.put(" zwiazanych", " związanych");
        map.put(" wiedze", " wiedzę");
        map.put(" szczegol", " szczegół");
        map.put(" obecnosc", " obecność");
        map.put(" pomieszczeniach", " pomieszczeniach");
        map.put(" pomieszczen ", " pomieszczeń ");
        map.put(" pomieszczen.", " pomieszczeń.");
        map.put(" pomieszczen,", " pomieszczeń,");
        map.put(" Wazne", " Ważne");
        map.put(" przysiag", " przysiąg");
        map.put(" straznicza", " strażnicza");
        map.put(" narzedzi", " narzędzi");
        map.put(" Zawartosc", " Zawartość");
        map.put(" polamany", " połamany");
        map.put(" oltarz", " ołtarz");
        map.put(" czyms", " czymś");
        map.put(" zabrac", " zabrać");
        map.put(" ciezarem", " ciężarem");
        map.put(" powyzej", " powyżej");
        map.put(" polowy", " połowy");
        map.put(" czlowieka", " człowieka");
        map.put(" Wyslowienie", " Wysłowienie");
        map.put(" stop", " stóp");
        map.put(" kanalow", " kanałów");
        map.put(" swieca", " świeca");
        map.put(" palaca", " paląca");
        map.put(" szkatulka", " szkatułka");
        map.put(" wskazujacy", " wskazujący");
        map.put(" osobe", " osobę");
        map.put(" pudelko", " pudełko");
        map.put(" Goraczka", " Gorączka");
        map.put(" oslabienie", " osłabienie");
        map.put(" bezsennosc", " bezsenność");
        map.put(" Zarazliwosc", " Zaraźliwość");
        map.put(" Wodociagow", " Wodociągów");
        map.put(" peknieta", " pękniętą");
        map.put(" dol ", " dół ");
        map.put(" laczy", " łączy");
        map.put(" znieksztalcona", " zniekształcona");
        map.put(" dawna", " dawną");
        map.put(" magie", " magię");
        map.put(" mgly", " mgły");
        map.put(" dzwiekow", " dźwięków");
        map.put(" zarastaja", " zarastają");
        map.put(" wywoluje", " wywołuje");
        map.put(" swiecacy", " świecący");
        map.put(" chwile", " chwilę");
        map.put(" rytual", " rytuał");
        map.put(" zadac", " zadać");
        map.put(" widza", " widzą");
        map.put(" przeklety", " przeklęty");
        map.put(" rozpoznawalny", " rozpoznawalny");
        map.put(" dowod", " dowód");
        map.put(" obietnice", " obietnicę");

        return map;
    }
}
