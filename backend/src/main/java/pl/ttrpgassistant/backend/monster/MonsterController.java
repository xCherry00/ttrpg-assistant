package pl.ttrpgassistant.backend.monster;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monsters")
public class MonsterController {

    private final MonsterRepository repo;

    public MonsterController(MonsterRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<MonsterDto> list() {
        return repo.findAllOrdered().stream()
                .map(m -> new MonsterDto(
                        m.getId(),
                        m.getNamePl(),
                        m.getNameEn(),
                        m.getInitiativeMod(),
                        m.getArmorClass(),
                        m.getHitPoints()
                ))
                .toList();
    }
}
