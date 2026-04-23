package pl.ttrpgassistant.backend.monster;

public record MonsterDto(
        Long id,
        String namePl,
        String nameEn,
        int initiativeMod,
        int armorClass,
        int hitPoints
) {}
