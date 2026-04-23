package pl.ttrpgassistant.backend.monster;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MonsterRepository extends JpaRepository<Monster, Long> {

    @Query("select m from Monster m order by m.namePl asc")
    List<Monster> findAllOrdered();
}
