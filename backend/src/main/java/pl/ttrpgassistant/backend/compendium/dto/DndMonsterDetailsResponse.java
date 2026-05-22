package pl.ttrpgassistant.backend.compendium.dto;

public record DndMonsterDetailsResponse(
        String index,
        String name,
        Integer armorClass,
        Integer hitPoints,
        String hitDice,
        Integer dexterity,
        Integer initiativeModifier,
        String size,
        String type,
        Double challengeRating,
        String sourceName,
        String sourceUrl
) {}

