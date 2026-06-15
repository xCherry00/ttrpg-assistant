package pl.ttrpgassistant.backend.generator;

import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
public class FoodQuickGeneratorStrategy implements GeneratorStrategy {
    private static final String GENERATOR = "food_quick";
    private static final String VARIANT = "general.quick";
    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return GENERATOR.equals(generatorCode) && VARIANT.equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        String foodType = stringParam(params, "foodType", "Losowy");

        List<GeneratorOutputSection> sections = randomChoice(foodType) ? randomMeal() : mealFor(foodType);
        String title = sectionContent(sections, "Nazwa", "Jedzenie");

        return new GeneratorStructuredResultResponse(
                null, GENERATOR, VARIANT, title, foodType, sections, "seed", OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> randomMeal() {
        return switch (random.nextInt(5)) {
            case 0 -> mealFor("Śniadanie");
            case 1 -> mealFor("Danie główne");
            case 2 -> mealFor("Zupa");
            case 3 -> mealFor("Napój bezalkoholowy");
            default -> mealFor("Napój alkoholowy");
        };
    }

    private List<GeneratorOutputSection> mealFor(String foodType) {
        String key = normalize(foodType);
        List<Meal> meals = switch (key) {
            case "sniadanie", "breakfast" -> breakfasts();
            case "zupa", "soup" -> soups();
            case "danie główne", "main course", "main" -> mains();
            case "deser", "dessert" -> desserts();
            case "napoj bezalkoholowy", "non-alcoholic drink", "non alcoholic drink" -> softDrinks();
            case "napoj alkoholowy", "alcoholic drink" -> alcoholicDrinks();
            default -> dailyMeals();
        };
        return meal(pickMeal(meals));
    }

    private List<GeneratorOutputSection> meal(Meal meal) {
        return List.of(
                section("Nazwa", meal.name()),
                section("Opis", meal.description()),
                section("Koszt", meal.cost())
        );
    }

    private Meal pickMeal(List<Meal> meals) {
        return meals.get(random.nextInt(meals.size()));
    }

    private List<Meal> breakfasts() {
        return List.of(
                new Meal("Owsianka Podroznika", "Gesty owies z jablkiem, orzechami i miodem.", "4 cp"),
                new Meal("Chleb z Solonym Maslem", "Gruby chleb, maslo z ziolami i kubek cieplego mleka.", "3 cp"),
                new Meal("Jajka Straznika", "Jajka sadzone z cebula, pieprzem i kromka zytniego chleba.", "6 cp"),
                new Meal("Kasza Miodowa", "Kasza jaglana z miodem, gruszka i prażonymi orzechami.", "5 cp"),
                new Meal("Placek Karczmarki", "Cienki placek z serem, koperkiem i chrupiaca skorka.", "7 cp"),
                new Meal("Ranne Racje", "Suszone owoce, twardy ser, chleb i lyzka gestej pasty fasólowej.", "5 cp"),
                new Meal("Omlet z Zielami", "Puszysty omlet z pietruszka, szczypiorkiem i mlodym serem.", "8 cp"),
                new Meal("Bulka Mlynarza", "Slodka bulka z makiem, maslem i konfitura sliwkowa.", "4 cp"),
                new Meal("Zupa Mleczna", "Cieple mleko z kluskami, cynamonem i kropla miodu.", "4 cp"),
                new Meal("Śniadanie Flisaka", "Chleb, wędzona ryba, kiszona cebula i kubek kwasu chlebowego.", "9 cp"),
                new Meal("Twarog z Rzodkwia", "Twarog ucierany z rzodkwia, sóla i swiezym koperkiem.", "5 cp"),
                new Meal("Pajda Drwala", "Chleb z fasóla, skwarkami i pikantna musztarda.", "8 cp"),
                new Meal("Goracy Kompot i Suchary", "Rozgrzewajacy kompot z suszu oraz kruche suchary.", "3 cp"),
                new Meal("Jajko w Popiele", "Jajko pieczone w popiele z sóla i kwasnym ogorkiem.", "4 cp"),
                new Meal("Śniadanie Kupieckie", "Ser, winogrona, jasny chleb i mały kielich lekkiego wina.", "2 sp"),
                new Meal("Gryczana Miska", "Kasza gryczana z maslem, grzybami i cebula.", "7 cp"),
                new Meal("Rogal Portowy", "Rogal z makiem, twarogiem i lyzka miodu.", "6 cp"),
                new Meal("Kluski Poranne", "Male kluski z mlekiem, maslem i prażona cebulka.", "6 cp"),
                new Meal("Zimna Deska", "Wedlina, ser, chleb i jablko podane bez czekania.", "1 sp"),
                new Meal("Śniadanie Uzdrowiciela", "Zioła, jajko na miękko, chleb i napar z melisy.", "8 cp")
        );
    }

    private List<Meal> soups() {
        return List.of(
                new Meal("Zupa Dymna", "Bulion warzywny z wędzona papryka i swiezym piecżywem.", "8 cp"),
                new Meal("Krupnik Traktowy", "Gesty krupnik z kasza, marchewka i kawalkami drobiu.", "1 sp"),
                new Meal("Barszcz z Bialym Korzeniem", "Kwasny barszcz z korzeniem pietruszki i fasóla.", "8 cp"),
                new Meal("Zupa Grzybowa z Mlyna", "Grzyby lesne, smietana i chleb czosnkowy.", "1 sp 2 cp"),
                new Meal("Rosól Najemnika", "Mocny rosól z makaronem, pieprzem i pietruszka.", "9 cp"),
                new Meal("Zalewajka Karczemna", "Ziemniaki, zakwas, kielbasa i majeranek.", "1 sp"),
                new Meal("Polewka Czosnkowa", "Czosnek, jaja, chleb i ostre ziola.", "7 cp"),
                new Meal("Zupa Rybaka", "Ryba rzeczna, por, koper i odrobina chrzanu.", "1 sp 4 cp"),
                new Meal("Soczewica Straznicza", "Soczewica z warzywami, kminkiem i wędzona skorka.", "8 cp"),
                new Meal("Krem z Dyni", "Dynia, maslo, pieprz i pestki prażone na ogniu.", "9 cp"),
                new Meal("Zupa z Pokrzyw", "Mlode pokrzywy, ziemniaki i jajko.", "6 cp"),
                new Meal("Kapusniak Zimowy", "Kwasna kapusta, suszone grzyby i wedzone mieso.", "1 sp"),
                new Meal("Zupa Cebulowa", "Cebula duszona na masle z grzanka i serem.", "1 sp 1 cp"),
                new Meal("Bulion z Kociołka", "Lekki bulion z warzywami i ziolami.", "5 cp"),
                new Meal("Grochowka Mostowa", "Groch, boczek, czosnek i gesta zawiesina.", "1 sp"),
                new Meal("Chlodnik Ogrodowy", "Zimna zupa z ziol, ogorka i kwasnego mleka.", "7 cp"),
                new Meal("Zupa Pieprzowa", "Ostry wywar z warzyw i duza iloscia pieprzu.", "8 cp"),
                new Meal("Kociolek Bagienny", "Ryba, korzenie, dzikie ziola i ciemny bulion.", "1 sp 3 cp"),
                new Meal("Zupa Piwna", "Piwo, ser, chleb i jajko w gestym wywarze.", "1 sp"),
                new Meal("Wywar Mnicha", "Warzywa, kasza i lagodne przyprawy.", "6 cp")
        );
    }

    private List<Meal> mains() {
        return List.of(
                new Meal("Pieczen Traktu", "Wolowina pieczona z cebula, marchewka i sosem z ziol.", "3 sp"),
                new Meal("Golonka pod Ciemnym Piwem", "Mieso duszone w piwie z kapusta i kminkiem.", "4 sp"),
                new Meal("Ryba z Patelnika", "Ryba rzeczna z maslem, cytryna i zielenina.", "2 sp 5 cp"),
                new Meal("Gulasz Najemnika", "Geste mieso z fasóla, papryka i chlebem.", "2 sp"),
                new Meal("Pierogi z Grzybami", "Pierogi z grzybami, cebula i smietana.", "1 sp 5 cp"),
                new Meal("Kaczka z Jablkiem", "Kaczka pieczona z jablkiem i majerankiem.", "5 sp"),
                new Meal("Zapiekanka Mlynarska", "Ziemniaki, ser, cebula i wedzone mieso.", "1 sp 8 cp"),
                new Meal("Kaszotto z Dziczyzna", "Kasza z kawalkami dziczyzny i jałowcem.", "3 sp"),
                new Meal("Kotlet Drwala", "Gruby kotlet z cebula, kapusta i chlebem.", "2 sp 2 cp"),
                new Meal("Warzywa w Miodzie", "Pieczone korzenie z miodem i orzechami.", "1 sp"),
                new Meal("Szaszlyk Portowy", "Mieso, cebula i papryka z rusztu.", "2 sp"),
                new Meal("Makaron Skryby", "Kluski z serem, pieprzem i maslem.", "1 sp 2 cp"),
                new Meal("Jagniecina z Rozmarynem", "Jagniecina duszona z rozmarynem i winem.", "5 sp"),
                new Meal("Placki Ziemniaczane", "Chrupkie placki z sosem czosnkowym.", "9 cp"),
                new Meal("Fasóla Kupiecka", "Fasóla z pomidorami, czosnkiem i ziołami.", "1 sp"),
                new Meal("Kurczak z Garnka", "Kurczak w sosie z warzywami i kasza.", "2 sp 5 cp"),
                new Meal("Miska Zelazna", "Kielbasa, ziemniaki, jajko i pikantny sos.", "2 sp"),
                new Meal("Ragu z Soczewicy", "Soczewica, grzyby i wino w gestym sosie.", "1 sp 4 cp"),
                new Meal("Pieczone Serce Kapusty", "Kapusta pieczona z maslem i serem.", "1 sp"),
                new Meal("Deska Awanturnika", "Mieso, ser, chleb, pikle i goracy sos.", "3 sp 5 cp")
        );
    }

    private List<Meal> desserts() {
        return List.of(
                new Meal("Kruszonka z Sadu", "Cieple owoce pod warstwa maslanej kruszonki.", "8 cp"),
                new Meal("Miodownik", "Ciasto z miodem, orzechami i gesta polewa.", "1 sp"),
                new Meal("Jablka w Ciescie", "Jablka smażone w cieście z cynamonem.", "7 cp"),
                new Meal("Makowe Kule", "Słodkie kule z maku, miodu i bakalii.", "8 cp"),
                new Meal("Gruszka w Winie", "Gruszka duszona w winie i przyprawach.", "1 sp 5 cp"),
                new Meal("Sernik Karczemny", "Gesty sernik z rodzynkami i smietana.", "1 sp"),
                new Meal("Piernik Podrozny", "Twardy piernik z miodem i korzeniami.", "6 cp"),
                new Meal("Krem z Orzechow", "Słodki krem orzechowy z chrupiacym chlebkiem.", "9 cp"),
                new Meal("Pudding Chlebowy", "Chleb, mleko, jajka i karmelizowany cukier.", "7 cp"),
                new Meal("Konfitura i Twarog", "Twarog z konfitura sliwkowa i miodem.", "6 cp"),
                new Meal("Rogal Krolewski", "Rogal z migdalami i lukrem.", "1 sp 2 cp"),
                new Meal("Suszone Owoce w Miodzie", "Mieszanka owocow, orzechow i miodu.", "8 cp"),
                new Meal("Ciastka Cynamonowe", "Male kruche ciastka z cynamonem.", "5 cp"),
                new Meal("Kisiel Jagodowy", "Goracy kisiel z jagod i miodu.", "5 cp"),
                new Meal("Tarta z Porzeczka", "Kwasna tarta z porzeczka i smietana.", "1 sp"),
                new Meal("Lody Snieznego Maga", "Zimny deser z mleka i magicznie chłódźonego kremu.", "3 sp"),
                new Meal("Słodki Ryż", "Ryż z mlekiem, miodem i skorka cytrusowa.", "6 cp"),
                new Meal("Placek z Dyni", "Dyniowy placek z przyprawami.", "8 cp"),
                new Meal("Cukrowe Migdały", "Migdały w cukrze i sóli.", "7 cp"),
                new Meal("Zloty Budyn", "Budyn jajeczny z miodem i szafranem.", "2 sp")
        );
    }

    private List<Meal> softDrinks() {
        return List.of(
                new Meal("Mietowa Lemoniada", "Lekki napoj z mieta, cytryna i odrobina miodu.", "5 cp"),
                new Meal("Kwas Chlebowy", "Lekko musujacy napoj z chleba i ziol.", "4 cp"),
                new Meal("Kompot z Suszu", "Cieply kompot z jablek, gruszek i sliwek.", "4 cp"),
                new Meal("Napar Melisowy", "Lagodne ziola z miodem.", "3 cp"),
                new Meal("Woda z Ogorkiem", "Chlodna woda z ogorkiem i sóla.", "2 cp"),
                new Meal("Sok Jablkowy", "Słodki sok z jablek z pobliskiego sadu.", "4 cp"),
                new Meal("Herbata Korzenna", "Herbata z gozdzikiem, cynamonem i miodem.", "5 cp"),
                new Meal("Mleko z Miodem", "Cieple mleko z miodem i szczypta sóli.", "4 cp"),
                new Meal("Napój Imbirowy", "Ostry napoj z imbirem i cytrusem.", "6 cp"),
                new Meal("Sok Porzeczkowy", "Kwasny sok rozcienczony woda.", "5 cp"),
                new Meal("Woda Różana", "Delikatnie pachnaca woda z platkami rozy.", "8 cp"),
                new Meal("Napar Pokrzywowy", "Ziolowy napar wzmacniajacy po podrozy.", "3 cp"),
                new Meal("Chlodnik do Picia", "Rzadki jogurt z ogorkiem i koprem.", "5 cp"),
                new Meal("Syrop Malinowy", "Słodki syrop z woda i lodem.", "5 cp"),
                new Meal("Tonik Gorzki", "Gorzki napoj z ziolami i skorka cytryny.", "7 cp"),
                new Meal("Woda Studzienna z Mieta", "Czysta woda, mieta i plaster jablka.", "2 cp"),
                new Meal("Napój Gruszkowy", "Słodki napoj z dojrzałych gruszek.", "5 cp"),
                new Meal("Cieply Sok z Bzu", "Rozgrzewajacy sok z czarnego bzu.", "6 cp"),
                new Meal("Herbata Dymna", "Mocna herbata o dymnym aromacie.", "6 cp"),
                new Meal("Eliksir Karczmarza", "Bezalkoholowa mieszanka ziol, miodu i cytryny.", "9 cp")
        );
    }

    private List<Meal> alcoholicDrinks() {
        return List.of(
                new Meal("Ciemne Piwo Karczmarza", "Pelne, lekko gorzkie, z nuta karmelu.", "8 cp"),
                new Meal("Jasne Piwo Traktowe", "Lekkie piwo dobre do obiadu.", "6 cp"),
                new Meal("Miod Pitny", "Słodki miod z korzennym finiszem.", "1 sp 2 cp"),
                new Meal("Wino Domowe", "Proste czerwone wino z beczki.", "1 sp"),
                new Meal("Gorzalka Pieprzowa", "Ostry alkohol na zimne wieczory.", "1 sp 5 cp"),
                new Meal("Nalewka Wisniowa", "Slodka nalewka z ciemnych wisni.", "1 sp 4 cp"),
                new Meal("Portowe Rumisko", "Ciemny rum z przyprawami.", "2 sp"),
                new Meal("Wino Gruszkowe", "Jasne wino o slodkim zapachu.", "1 sp"),
                new Meal("Pale Ale z Mlyna", "Gorzkie piwo z lekkim aromatem zboza.", "8 cp"),
                new Meal("Likier Ziolowy", "Gorzki likier z tajemna mieszanka ziol.", "2 sp"),
                new Meal("Sliwowica", "Mocny destylat ze sliwek.", "2 sp"),
                new Meal("Cydr Jesienny", "Lekki cydr z kwasnym posmakiem.", "7 cp"),
                new Meal("Wino Mszalne", "Lagodne wino kupowane od klasztoru.", "1 sp 3 cp"),
                new Meal("Piwo Pszeniczne", "Mgliste piwo z nuta gozdzikow.", "8 cp"),
                new Meal("Krwawe Wino", "Ciemne wino z cierpkich owocow.", "1 sp 5 cp"),
                new Meal("Bimber z Piwnicy", "Niepewny, mocny i tani.", "7 cp"),
                new Meal("Miod Dymny", "Miod pitny z aromatem dymu.", "1 sp 6 cp"),
                new Meal("Wino Lodowe", "Słodkie i drogie wino z zimnych owocow.", "4 sp"),
                new Meal("Karczemny Porter", "Ciezkie piwo na długie rozmowy.", "1 sp"),
                new Meal("Nalewka Mnicha", "Ziolowa nalewka sprzedawana w małych kielichach.", "2 sp")
        );
    }

    private List<Meal> dailyMeals() {
        return List.of(
                new Meal("Posilek Dnia", "Proste jedzenie, ale swieze i sycace.", "1 sp"),
                new Meal("Miska Karczemna", "Kasza, warzywa i odrobina miesa.", "9 cp"),
                new Meal("Deska Podrozna", "Chleb, ser, suszone mieso i pikle.", "1 sp 2 cp"),
                new Meal("Gulasz Dnia", "Gulasz z tego, co kuchnia ma pod reka.", "1 sp 5 cp"),
                new Meal("Zupa i Chleb", "Ciepla zupa z bochenkiem chleba.", "8 cp"),
                new Meal("Ryba albo Fasóla", "Prosty wybór zależny od dostaw.", "1 sp"),
                new Meal("Kociolek Gospodarza", "Danie z warzyw, sosu i lokalnych przypraw.", "1 sp"),
                new Meal("Talerz Robotnika", "Ziemniaki, jajko, cebula i chleb.", "8 cp"),
                new Meal("Kolacja Straznika", "Kielbasa, kapusta i ciemne pieczywo.", "1 sp 4 cp"),
                new Meal("Racje na Wynos", "Twardy ser, suchary, suszone owoce i mała sakiewka sóli.", "1 sp"),
                new Meal("Pieczen Resztkowa", "Kawalki pieczeni w sosie z warzywami.", "1 sp 6 cp"),
                new Meal("Miska Wegetarianska", "Kasza, grzyby, warzywa i ziola.", "9 cp"),
                new Meal("Danie Portowe", "Ryba, chleb i kwasna cebula.", "1 sp 3 cp"),
                new Meal("Danie Zimowe", "Kapusta, groch i wedzone mieso.", "1 sp 2 cp"),
                new Meal("Danie Szlaku", "Jedzenie szybkie, slone i latwe do spakowania.", "8 cp"),
                new Meal("Danie Szynkarza", "Najlepsza rzecz, jaka zostala w kuchni po zmroku.", "1 sp"),
                new Meal("Talerz Kupiecki", "Ser, chleb, oliwki, wedlina i owoc.", "2 sp"),
                new Meal("Kolacja Ubogich", "Zupa, chleb i gotowana cebula.", "4 cp"),
                new Meal("Posilek Uczty", "Drobna porcja z kilku lepszych potraw.", "3 sp"),
                new Meal("Nocna Miska", "Goraca kasza z jajkiem i ostrym sosem.", "9 cp")
        );
    }

    private String sectionContent(List<GeneratorOutputSection> sections, String title, String fallback) {
        return sections.stream()
                .filter(section -> title.equals(section.title()))
                .map(GeneratorOutputSection::content)
                .filter(content -> content != null && !content.isBlank())
                .findFirst()
                .orElse(fallback);
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean randomChoice(String value) {
        String normalized = normalize(value);
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("random");
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase().trim();
    }

    private record Meal(String name, String description, String cost) {}
}
