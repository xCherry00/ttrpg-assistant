package pl.ttrpgassistant.backend.notes;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.notes.dto.CreateUserNoteRequest;
import pl.ttrpgassistant.backend.notes.dto.UpdateUserNoteRequest;
import pl.ttrpgassistant.backend.notes.dto.UserNoteResponse;

import java.util.List;

import static org.springframework.http.HttpStatus.NO_CONTENT;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class UserNoteController {

    private final UserNoteService userNoteService;

    @GetMapping
    public List<UserNoteResponse> list(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return userNoteService.list(userId);
    }

    @PostMapping
    public UserNoteResponse create(
            Authentication auth,
            @Valid @RequestBody CreateUserNoteRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return userNoteService.create(userId, request);
    }

    @PatchMapping("/{id}")
    public UserNoteResponse update(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserNoteRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return userNoteService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void delete(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        userNoteService.delete(userId, id);
    }
}
