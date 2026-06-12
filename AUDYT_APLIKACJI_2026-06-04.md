# Audyt aplikacji ttrpg-assistant - aktualizacja 2026-06-05

## Zakres

Raport nadpisuje poprzedni audyt z 2026-06-04. Obejmuje:

- porównanie poprzednich ustaleń z aktualnym stanem kodu,
- live smoke test frontendu i backendu w Dockerze,
- przegląd responsywności w widoku mobilnym 390x844,
- przegląd działania głównych tras i widocznych przycisków,
- statyczny review bezpieczeństwa backendu i frontendu,
- podstawowe próby injection na publicznych endpointach,
- uruchomienie aktualnych testów i komend jakości.

Nie był to pełny pentest produkcyjny ani fuzzing wszystkich endpointów. Przegląd wykonano na lokalnym środowisku developerskim i aktualnym dirty tree.

## Wynik ogólny

Usługi działają lokalnie:

- frontend: `http://localhost:5173`,
- backend: `http://localhost:8080`,
- PostgreSQL: healthy.

Komendy:

- `npm.cmd run build` - OK,
- `npm.cmd run lint` - OK,
- `mvn test -q` - OK,
- `npm.cmd test -- --run` - FAIL: 20 failed / 108 passed.

Najważniejszy stan:

- część krytycznych ustaleń backendowych z poprzedniego audytu została poprawiona,
- frontend nadal ma realny runtime error na stronie profilu,
- mobile nie jest bezpiecznie domknięty: `/campaigns`, `/rules`, `/glossary` i `/compendium` mają problemy z widocznością treści,
- nie znaleziono klasycznego SQL injection w przejrzanych ścieżkach,
- zostały ryzyka upload/storage i kilka widocznych przycisków bez realnej akcji.

## Status poprzedniego audytu

| Punkt z 2026-06-04 | Status | Komentarz |
| --- | --- | --- |
| 1. Live session: wymagane rzuty | Fixed / cleanup needed | Funkcja została usunięta z JS/backendu, ale zostały martwe style `.liveSessionRequiredRoll...` w `frontend/src/styles/live-session.css`. |
| 2. Campaign detail: materiały/notatki niedostępne | Fixed jako decyzja produktowa / risk | `CampaignDetailPage` i hook nie ładują już `materials/playerNotes`, więc niespójność zniknęła. API i stare komponenty nadal istnieją, więc jeśli funkcja ma wrócić, wymaga osobnego flow. |
| 3. Publiczny POST generatorów zapisuje anonimowo | Fixed | `GeneratorService.generateVariant` nie zapisuje wyniku bez `userId`, a `campaignId` przechodzi przez owner/member check. |
| 4. Password reset bez rate limitu | Fixed | `AuthRateLimiter` ma limity dla forgot/reset password. |
| 5. Multipart wiadomości omija limit 4000 | Fixed | Obie ścieżki przechodzą przez `MessageService.sendMessage`, gdzie jest limit 4000. |
| 6. Uploady ufają MIME | Partially fixed | `ImageUploadService` sprawdza magic bytes dla głównego uploadu obrazów, ale nie dekoduje całego obrazu. Załączniki wiadomości nadal bazują na MIME/rozszerzeniu. |
| 7. GM session notes bez limitu | Fixed | DTO notatek sesji i wiadomości sesji mają limity długości. |
| 8. JWT w localStorage i query stringu SSE | Partially fixed | SSE używa już `Authorization` header, nie query stringa. Token nadal jest w `localStorage`. |
| 9. Widoczność kampanii niespięta z formularzem | Fixed | `SettingsWorkspace` ma kontrolowane `form.visibility` i wysyła je przy zapisie. |
| 10. Planned session wymaga drugiego kliknięcia | Fixed | Start sesji nawiguje do live route. |
| 11. Frontend lint czerwony | Fixed | `npm.cmd run lint` przechodzi. |
| 12. Frontend testy czerwone | Open | Nadal 20 failed / 108 passed. |

## Krytyczne / wysokie

### 1. `/profile` nadal wywala aplikację podczas renderowania

**Poziom:** High  
**Pliki:**

- `frontend/src/pages/ProfilePage.jsx:282`
- `frontend/src/pages/ProfilePage.jsx:389`

**Dowód:**  
Live test na `http://localhost:5173/profile` w mobile 390x844 pokazuje error overlay:

`ReferenceError: Cannot access 'closeEditModal' before initialization`

`useEffect` używa `closeEditModal` w dependency array przed inicjalizacją `const closeEditModal = useCallback(...)`.

**Wpływ:**  
Cała strona profilu jest niedostępna. Dodatkowo blokuje testowanie zmian avatara/baneru profilu.

**Rekomendacja:**  
Przenieść deklarację `closeEditModal` nad efekt, który jej używa, albo rozbić efekt tak, żeby nie referował handlera przed inicjalizacją.

### 2. Mobile: `/rules` i `/glossary` mają desktopowy układ ściśnięty do prawej krawędzi

**Poziom:** High  
**Pliki:**

- `frontend/src/styles/rules.css:12`
- `frontend/src/styles/rules.css:315`
- `frontend/src/styles/rules.css:379`
- `frontend/src/styles/glossary.css:12`
- `frontend/src/styles/glossary.css:292`
- `frontend/src/styles/glossary.css:308`

**Dowód:**  
Live sweep 390x844 wykazał elementy treści przesunięte w okolice `x=367-390` i szerokości około `40-46px`. Przykłady:

- `.rulesReaderPanel` widoczny jako wąski pasek przy prawej krawędzi,
- `.glossaryRight` widoczny jako wąski pasek przy prawej krawędzi.

**Wpływ:**  
Na telefonie treść zasad i słownika jest praktycznie nieczytelna mimo braku klasycznego poziomego scrolla dokumentu.

**Rekomendacja:**  
W breakpointach mobilnych ustawić układ jedną kolumną, usunąć wymuszone pozycjonowanie/overflow po prawej stronie, upewnić się, że panel treści ma `width: 100%`, `min-width: 0` i nie jest wypychany przez sidebar.

### 3. Mobile: `/campaigns` ma elementy o szerokości około 1856px

**Poziom:** High  
**Pliki:**

- `frontend/src/styles/campaigns.css:55`
- `frontend/src/styles/campaigns.css:91`
- `frontend/src/styles/campaigns.css:1372`
- `frontend/src/styles/campaigns.css:1404`
- `frontend/src/styles/campaigns.css:1811`

**Dowód:**  
Live sweep 390x844:

- `.campaignListTabs` ma `w=1856`,
- `.campaignQuickActions` ma `w=1856`,
- przyciski tabów mają szerokości około 900px.

Dokument raportuje `scrollWidth=390`, więc problem jest najpewniej maskowany przez overflow/clip, ale treść jest nienaturalnie szeroka i niedostępna.

**Wpływ:**  
Widok kampanii na mobile może wyglądać jak ucięty, z przyciskami poza ekranem.

**Rekomendacja:**  
Przejrzeć późne override'y w `campaigns.css`, szczególnie reguły po breakpointach. Dla mobile wymusić `grid-template-columns: 1fr`, `width: 100%`, `max-width: 100%`, `min-width: 0`, a nie `max-content`.

### 4. Mobile: `/compendium` ma tabelę szerszą niż ekran

**Poziom:** Medium/High  
**Pliki:**

- `frontend/src/pages/CompendiumPage.jsx`
- `frontend/src/styles/compendium.css`

**Dowód:**  
Live sweep 390x844:

- `.compendiumTable` ma `w=509`, czyli wychodzi poza viewport 390px,
- kolumny `AC`, `HP`, `CR` są poza widocznym obszarem.

**Wpływ:**  
Na telefonie użytkownik może nie widzieć wszystkich danych potworów/rekordów. Scroll dokumentu nie pokazuje problemu, bo overflow jest zamknięty w panelu.

**Rekomendacja:**  
Na mobile zamienić tabelę wyników na listę kart albo dodać jawny poziomy scroll z widoczną wskazówką i bez ucinania prawego panelu.

## Średnie

### 5. Widoczne przyciski bez realnej akcji

**Poziom:** Medium  
**Pliki przykładowe:**

- `frontend/src/pages/campaign/CampaignDetailPage.jsx:841` - `Więcej`,
- `frontend/src/pages/campaign/CampaignDetailPage.jsx:994` - `Zarządzaj rolami`,
- `frontend/src/pages/campaign/CampaignDetailPage.jsx:1029` - `Udostępnij link`,
- `frontend/src/pages/MessagesPage.jsx:377` - menu rozmowy,
- `frontend/src/pages/CampaignsPage.jsx:748` - ikony akcji w kampaniach,
- `frontend/src/pages/FriendsPage.jsx:141`,
- `frontend/src/pages/FriendsPage.jsx:208`.

**Wpływ:**  
Użytkownik widzi kontrolki, które wyglądają na działające, ale nie wykonują oczekiwanej akcji.

**Rekomendacja:**  
Podpiąć funkcje albo ukryć/ustawić `disabled` z jasnym stanem, dopóki funkcja nie istnieje.

### 6. Frontend test suite nadal nie jest wiarygodną bramką jakości

**Poziom:** Medium  
**Komenda:** `npm.cmd test -- --run`

**Wynik:**  
8 failed files, 20 failed tests, 108 passed.

Failujące obszary:

- `AccountMenu.test.jsx`,
- `CampaignSessionsPanel.test.jsx`,
- `SettingsPage.test.jsx`,
- `UpcomingSessionPanel.test.jsx`,
- `DashboardPage.test.jsx`,
- `GeneratorsPage.test.jsx`,
- `CharactersPage.test.jsx`,
- `ImageUpload.test.jsx`.

**Uwaga:**  
Część porażek wynika z testów bez polskich znaków, ale nie wszystkie są kosmetyczne. Przykładowo `CharactersPage.test.jsx` pokazuje też 401 przy pobieraniu kampanii w testowym flow.

**Rekomendacja:**  
Oddzielić testy nieaktualne po redesignie od realnych regresji i doprowadzić suite do zielonego stanu.

### 7. Profil ma martwy panel narzędzi i widoczne artefakty tekstowe

**Poziom:** Medium/Low  
**Pliki:**

- `frontend/src/pages/ProfilePage.jsx:477`
- `frontend/src/pages/ProfilePage.jsx:576`
- `frontend/src/pages/ProfilePage.jsx:625`
- `frontend/src/pages/ProfilePage.jsx:643`

**Dowód:**  
Panel `tools` ma render, ale nie ma taba w `tabs`, więc jest nieosiągalny. W kampaniach profilu renderuje się tekst:

`{campaign.status} ? {campaign.system} ? ostatnio ...`

**Wpływ:**  
Po naprawie runtime errora profil nadal będzie miał martwą sekcję i widoczne znaki `?` jako separatory.

**Rekomendacja:**  
Dodać tab `Narzędzia` albo usunąć panel. Separatory zmienić na `•`, przecinek albo układ badge'y.

### 8. Pozostałości po usuniętych funkcjach

**Poziom:** Low  
**Pliki:**

- `frontend/src/styles/live-session.css:567`
- `frontend/src/styles/live-session.css:790`
- `frontend/src/styles/live-session.css:983`
- `frontend/src/pages/campaign/components/CampaignMaterialsPanel.jsx`
- `frontend/src/api/campaigns.js:200`
- `frontend/src/api/campaigns.js:215`

**Opis:**  
Wymagane rzuty są usunięte z logiki, ale style zostały. Materiały/notatki są usunięte z bieżącego campaign detail, ale API i komponenty nadal istnieją.

**Rekomendacja:**  
Potwierdzić docelowy zakres produktu i usunąć martwe elementy albo przywrócić pełny flow.

## Bezpieczeństwo

### 9. SQL injection - nie znaleziono klasycznej podatności

**Poziom:** Informational  

**Dowód:**

- Repozytoria używają Spring Data JPA, parametrów `@Param` i metod repozytoryjnych.
- Dynamiczna próba `q=' OR '1'='1` na `/api/compendium/dnd5e/monsters` zwróciła `200 []`.
- Public campaigns bez auth zwróciły `401`, więc nie dało się użyć tej ścieżki anonimowo.

**Wniosek:**  
Brak aktualnego findingu SQL injection w przejrzanych miejscach.

### 10. Generator anonimowy - poprawiony zapis, ale publiczne generowanie nadal możliwe

**Poziom:** Fixed / accepted behavior  
**Pliki:**

- `backend/src/main/java/pl/ttrpgassistant/backend/generator/GeneratorController.java:62`
- `backend/src/main/java/pl/ttrpgassistant/backend/generator/GeneratorService.java:189`
- `backend/src/main/java/pl/ttrpgassistant/backend/generator/GeneratorService.java:222`

**Dowód:**  
Anonimowy `POST /api/generators/any/name/generate` zwrócił `200`, ale wynik nie zawierał `id`. Kod zwraca wygenerowany wynik przed `save`, jeśli `userId == null`. Gdy `campaignId != null`, zapis wymaga owner/member check.

**Rekomendacja:**  
Jeśli generowanie anonimowe ma zostać publiczne, rozważyć rate limit, żeby ograniczyć spam i koszt generowania.

### 11. Załączniki wiadomości nadal ufają MIME/rozszerzeniu

**Poziom:** Medium  
**Pliki:**

- `backend/src/main/java/pl/ttrpgassistant/backend/messages/MessageService.java:426`
- `backend/src/main/java/pl/ttrpgassistant/backend/messages/MessageService.java:436`
- `backend/src/main/java/pl/ttrpgassistant/backend/messages/MessageService.java:523`

**Opis:**  
`MessageService` normalizuje `file.getContentType()` i kopiuje plik na dysk. Dla załączników nie ma magic bytes ani dekodowania obrazów. Poprawka `ImageUploadService` nie obejmuje tej ścieżki.

**Wpływ:**  
Użytkownik może wysłać plik udający obraz lub dozwolony dokument. Ryzyko zależy od sposobu pobierania/serwowania załączników.

**Rekomendacja:**  
Dla obrazów w załącznikach zastosować tę samą walidację co upload obrazów, a dla dokumentów wymuszać bezpieczne serwowanie jako attachment.

### 12. Upload obrazów ma magic bytes, ale nie pełne dekodowanie

**Poziom:** Medium/Low  
**Pliki:**

- `backend/src/main/java/pl/ttrpgassistant/backend/upload/ImageUploadService.java:40`
- `backend/src/main/java/pl/ttrpgassistant/backend/upload/ImageUploadService.java:70`

**Opis:**  
JPEG/PNG/WEBP są sprawdzane po sygnaturach. Plik z poprawnym nagłówkiem i uszkodzoną zawartością może przejść.

**Rekomendacja:**  
Po magic bytes dodać próbę dekodowania obrazu, np. `ImageIO` dla JPG/PNG i osobną obsługę WEBP albo zewnętrzną bibliotekę.

### 13. Walidator URL-i obrazków dopuszcza SVG data URL

**Poziom:** Medium/Low  
**Pliki:**

- `backend/src/main/java/pl/ttrpgassistant/backend/common/validation/SafeImageOrHttpUrlValidator.java:12`
- `backend/src/main/java/pl/ttrpgassistant/backend/campaign/dto/CreateCampaignRequest.java:13`
- `backend/src/main/java/pl/ttrpgassistant/backend/campaign/dto/CreateCampaignRequest.java:14`
- `backend/src/main/java/pl/ttrpgassistant/backend/character/dto/QuickCreateDndCharacterRequest.java:12`

**Opis:**  
Walidator akceptuje `data:image/svg+xml`. Jeśli taki URL trafi do kontekstu innego niż bezpieczny `<img>`, zwiększa powierzchnię XSS/content spoofing.

**Rekomendacja:**  
Nie dopuszczać SVG data URL w polach użytkownika albo ograniczyć wyłącznie do kontrolowanych assetów aplikacji.

### 14. JWT nie jest już w SSE query stringu, ale nadal jest w localStorage

**Poziom:** Medium  
**Pliki:**

- `frontend/src/auth/authstorage.js:4`
- `frontend/src/api/realtime.js:42`
- `frontend/src/api/realtime.js:44`

**Opis:**  
Realtime używa teraz nagłówka `Authorization`, co zamyka poprzedni problem query string leakage. Token JWT pozostaje w `localStorage`.

**Wpływ:**  
Każdy XSS ma łatwy dostęp do tokenu.

**Rekomendacja:**  
Docelowo rozważyć httpOnly secure cookie albo krótkotrwały token realtime i ostrzejszą walidację źródeł obrazów/HTML.

### 15. UploadController buduje URL z danych requestu

**Poziom:** Low/Risk  
**Plik:** `backend/src/main/java/pl/ttrpgassistant/backend/upload/UploadController.java:27`

**Opis:**  
URL po uploadzie jest budowany z `request.getScheme()`, `getServerName()` i `getServerPort()`. Przy złej konfiguracji proxy może to skutkować host-header poisoning w zwracanym URL.

**Rekomendacja:**  
Używać skonfigurowanego publicznego base URL z env albo zwracać ścieżkę względną.

### 16. CSP/CORS - brak bezpośredniej podatności, ale konfiguracja jest dev-centryczna

**Poziom:** Low/Risk  
**Pliki:**

- `backend/src/main/java/pl/ttrpgassistant/backend/config/CorsConfig.java`
- `backend/src/main/java/pl/ttrpgassistant/backend/security/SecurityConfig.java`

**Opis:**  
CORS jest allowlistowany i `allowCredentials(false)`. CSP zawiera localhostowe źródła i wygląda jak header API, niekoniecznie realnie chroniący frontend assets w docelowym deployu.

**Rekomendacja:**  
Przenieść źródła CSP do konfiguracji środowiskowej i zweryfikować, gdzie header jest faktycznie nakładany w produkcji.

## Responsywność - live smoke 390x844

Sprawdzone trasy:

- `/dashboard` - OK, brak poziomego overflow,
- `/campaigns` - FAIL, elementy 1856px szerokości,
- `/characters` - OK w smoke, brak poziomego overflow,
- `/dice` - OK w smoke, brak poziomego overflow,
- `/initiative` - OK w smoke, brak poziomego overflow,
- `/generators` - OK w smoke, brak poziomego overflow,
- `/compendium` - FAIL/RISK, tabela szersza niż ekran,
- `/rules` - FAIL, panel treści uciśnięty przy prawej krawędzi,
- `/glossary` - FAIL, panel treści uciśnięty przy prawej krawędzi,
- `/friends` - OK w smoke,
- `/messages` - OK w smoke,
- `/profile` - FAIL, runtime error,
- `/settings` - OK w smoke.

Uwaga: brak `document.scrollWidth > clientWidth` nie oznacza pełnej responsywności. W kilku miejscach problem jest maskowany przez overflow/clip wewnątrz paneli.

## Funkcjonalność UI - smoke

Potwierdzone jako poprawione:

- modale zmiany ikony/baneru kampanii są podpięte do nagłówka,
- `Zaproś gracza` otwiera modal i korzysta z kandydatów znajomych,
- strona główna, dashboard, kości, inicjatywa, znajomi, wiadomości i ustawienia renderują się bez error overlay w podstawowym smoke.

Niezweryfikowane w pełni:

- realne multi-user flow zaproszeń do kampanii,
- pełny chat z wieloma załącznikami,
- pełny import/eksport postaci po wszystkich zakładkach,
- wszystkie akcje profilu, bo `/profile` jest zablokowany runtime errorem.

## Najpilniejsze rekomendacje

1. Naprawić `ProfilePage` runtime error z `closeEditModal`.
2. Naprawić mobile layout `/rules`, `/glossary`, `/campaigns` i tabelę `/compendium`.
3. Uporządkować widoczne przyciski bez handlerów.
4. Doprowadzić `npm.cmd test -- --run` do zielonego stanu.
5. Rozszerzyć walidację załączników wiadomości o realny typ pliku.
6. Dodać pełne dekodowanie obrazów po magic bytes.
7. Usunąć lub domknąć martwe pozostałości po wymaganych rzutach, materiałach i notatkach.
8. Ograniczyć `data:image/svg+xml` w polach użytkownika.
9. Rozważyć rate limit publicznych generatorów.
10. Docelowo przenieść JWT z `localStorage` do bezpieczniejszego mechanizmu sesji.
