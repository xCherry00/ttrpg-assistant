# TTRPG Assistant

> 🇵🇱 [Polski](#-po-polsku) &nbsp;|&nbsp; 🇬🇧 [English](#-in-english)

---

## 🇵🇱 Po polsku

### Czym jest ten projekt?

Zrobiłem tę aplikację jako projekt inżynierski — apka webowa dla graczy i Mistrzów Gry TTRPG (Dungeons & Dragons, Pathfinder i podobne). Zamiast trzymać notatki w 6 różnych miejscach, tutaj masz wszystko w jednym: kampanie, postaci, generatory, inicjatywę, słownik pojęć.

Każdy użytkownik ma konto — dane są izolowane, nie widzisz cudzych kampanii ani postaci.

### Co potrafi

- **Kampanie** — tworzysz kampanię, zapraszasz graczy kodem zaproszenia, planujesz sesje, dodajesz materiały, prowadzisz notatki
- **Postaci** — kreator postaci powiązany z kontem, dane w JSONB (elastyczny schemat)
- **Generatory** — losowe NPC, łup, lokacje, starcia, frakcje — wyniki seed-based, więc powtarzalne
- **Kości** — rzucanie kośćmi bezpośrednio w aplikacji
- **Inicjatywa** — tracker kolejności w walce
- **Słownik** — pojęcia TTRPG z opisami
- **Social** — znajomi, publiczne profile, blokowanie użytkowników
- **Wiadomości** — bezpośrednie wiadomości między użytkownikami

### Jak to działa (architektura)

```
Przeglądarka (React SPA)
        │
        │  HTTP — Vite proxy /api → :8080
        ▼
  Spring Boot REST API (:8080)
        │
        │  JDBC / JPA
        ▼
  PostgreSQL 16 (:5432)
  Flyway migrations
```

Frontend to React SPA serwowany przez Vite. Wszystkie requesty do `/api` Vite proxy'uje na backend (port 8080). Backend to Spring Boot — przyjmuje JSON, waliduje, odpowiada JSON. Dane siedzą w Postgresie, schemat zarządzany przez Flyway (migracje V1–V72).

Auth: po zalogowaniu backend zwraca JWT. Frontend trzyma go w pamięci (AuthContext) i dokłada do każdego requesta jako `Authorization: Bearer <token>`. Spring Security weryfikuje go na każdym endpoincie.

### Stack — dlaczego akurat to

| Co       | Czym                        | Dlaczego                                                                          |
| -------- | --------------------------- | --------------------------------------------------------------------------------- |
| Frontend | React 19 + Vite 7           | SPA, szybkie HMR podczas developmentu, lazy loading stron                         |
| Styling  | Custom CSS + CSS variables  | Pełna kontrola nad motywem, dark/light bez biblioteki                             |
| Backend  | Spring Boot 3.5.x, Java 17  | Sprawdzony enterprise stack, dużo gotowych mechanizmów (security, walidacja, JPA) |
| ORM      | Spring Data JPA + Hibernate | Nie chciałem pisać SQL ręcznie dla podstawowych operacji                          |
| Migracje | Flyway                      | Wersjonowanie schematu, rollback, historia zmian                                  |
| Auth     | JWT (JJWT 0.12)             | Bezstanowe, nie trzeba trzymać sesji po stronie serwera                           |
| Baza     | PostgreSQL 16               | JSONB dla elastycznych danych postaci, solidne FK i indeksy                       |
| Infra    | Docker Compose              | Żeby backend + baza działały jedną komendą lokalnie                               |

### Uruchomienie lokalne

**Wymagania:**

| Narzędzie           | Wersja |
| ------------------- | ------ |
| Node.js             | 20+    |
| Java JDK            | 17+    |
| Docker + Compose v2 | 24+    |

**Setup:**

```bash
# 1. Sklonuj repo
git clone <repo-url>
cd ttrpg-assistant

# 2. Skonfiguruj zmienne środowiskowe
cp .env.example .env
# Otwórz .env i uzupełnij wartości — szczegóły w .env.example

# 3. Zbuduj backend JAR
cd backend
mvn -q -DskipTests package

# 4. Uruchom bazę danych i backend
cd ../infra
docker compose up -d --build

# 5. Uruchom frontend
cd ../frontend
npm install
npm run dev
```

**Sprawdź czy działa:**

```bash
curl http://localhost:8080/api/health   # powinno zwrócić: OK
# Frontend: http://localhost:5173
```

Zarejestruj konto na `/register` — jeśli dashboard się załaduje, wszystko gra.

**Przydatne przy developmencie:**

```bash
# Logi backendu na żywo
docker logs ttrpg_backend -f --tail 50

# Wejście do bazy
docker exec -it ttrpg_db psql -U ttrpg -d ttrpg

# Przebuduj backend po zmianach w kodzie
cd backend && mvn -q -DskipTests package
cd ../infra && docker compose up -d --build backend
```

**Backend Docker workflow (zawsze aktualny JAR):**

```bash
cd backend
mvn -q -DskipTests package
cd ../infra
docker compose down
docker compose up -d --build
```

Jeśli backend uruchamia stary kod, przyczyną zwykle jest brak świeżego `mvn package` przed compose build (Dockerfile kopiuje `target/*.jar`).

**Weryfikacja kodu:**

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd ../backend
mvn test
```

### Struktura projektu

```
ttrpg-assistant/
├── backend/src/main/java/pl/ttrpgassistant/backend/
│   ├── auth/           # rejestracja, logowanie, JWT
│   ├── campaign/       # kampanie, sesje, materiały, wiadomości, notatki
│   ├── character/      # postaci gracza (JSONB)
│   ├── generator/      # generatory seed/algorithm
│   ├── security/       # JwtAuthFilter, SecurityConfig
│   ├── social/         # znajomi, blokowanie, profile publiczne
│   ├── user/           # ustawienia konta, aktywność
│   └── common/error/   # GlobalExceptionHandler → spójne błędy HTTP
│
├── backend/src/main/resources/
│   ├── application.yml             # konfiguracja przez zmienne środowiskowe
│   └── db/migration/V1–V72*.sql    # cała historia schematu
│
├── frontend/src/
│   ├── api/        # cienkie wrappery na fetch, po jednym pliku na moduł
│   ├── auth/       # AuthContext, ProtectedRoute
│   ├── pages/      # ~14 stron, wszystkie lazy loaded
│   └── styles/     # CSS per strona + theme.css (CSS variables)
│
└── infra/
    └── docker-compose.yml   # PostgreSQL 16 + backend kontener
```

### Baza danych — główne tabele

```
users                     konta, role, profil
campaigns                 kampanie (owner, kod zaproszenia, status)
campaign_members          kto jest w kampanii i z jaką rolą (gm/player)
campaign_sessions         sesje (scheduled → started → finished)
campaign_session_notes    notatki per sesja, per użytkownik
campaign_materials        linki i opisy materiałów do sesji
player_characters         postaci + character_data_json (JSONB)
friendships               relacje znajomości
friend_requests           zaproszenia (pending/accepted/rejected)
generator_pools           dane dla generatorów seed-based
monsters / glossary_terms dane statyczne (baza potworów, słownik)
```

### Typowe błędy przy uruchamianiu

| Błąd                            | Przyczyna                                                        | Fix                                                                                     |
| ------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Invalid CORS request`          | Port frontendu nie zgadza się z `CORS_ALLOWED_ORIGINS` w `.env`  | Zaktualizuj `.env`, zrestartuj backend                                                  |
| `HTTP 500` przy rejestracji     | Backend nie działa lub baza nie jest gotowa                      | `docker ps`, sprawdź logi                                                               |
| Biała pusta strona              | Błąd JS                                                          | F12 → Console                                                                           |
| `401 Unauthorized` wszędzie     | Wygasły token                                                    | Wyloguj i zaloguj ponownie                                                              |
| Flyway error przy starcie       | Konflikt wersji migracji                                         | `SELECT * FROM flyway_schema_history` — znajdź co się nie zgadza                        |
| Backend działa na starym kodzie | Dockerfile kopiuje `target/*.jar`, a JAR nie został przebudowany | Przed `docker compose up -d --build` uruchom `cd backend && mvn -q -DskipTests package` |

### Znane ograniczenia i TODO techniczne

- Testy obejmują już backend i frontend (w tym campaign workspace i initiative panele), ale coverage integracyjny i end-to-end nadal warto rozwijać.
- Frontend w JavaScript — bez TypeScript i bez PropTypes
- Brak Swagger/OpenAPI — endpointy opisane tylko w kontrolerach
- `tailwindcss` w `package.json` — wciągnięty, nigdy nieużyty
- Backend używa stabilnej wersji Spring Boot `3.4.1`; przy aktualizacjach trzymaj się wydań stabilnych zamiast snapshotów
- Token JWT jest trzymany po stronie frontendu w `localStorage`, co jest wygodne lokalnie, ale wymaga ostrożności przy XSS w produkcji

---

## 🇬🇧 In English

### What is this?

TTRPG Assistant is a web application I built as my engineering thesis project. It's a tool for tabletop RPG players and Game Masters (Dungeons & Dragons, Pathfinder, etc.) — instead of juggling notes across 6 different apps, everything lives here: campaigns, characters, generators, initiative tracking, a glossary.

Every user has an account — data is isolated, you only see your own campaigns and characters.

### Features

- **Campaigns** — create a campaign, invite players via join code, plan sessions, attach materials, keep session notes
- **Characters** — character creator tied to your account, flexible JSONB data schema
- **Generators** — random NPCs, loot, locations, encounters, factions — results are seed-based so they're reproducible
- **Dice** — roll dice directly in the app
- **Initiative** — combat order tracker
- **Glossary** — TTRPG terms and descriptions
- **Social** — friends, public profiles, blocking users
- **Messages** — direct messages between users

### How it works (architecture)

```
Browser (React SPA)
       │
       │  HTTP — Vite proxy /api → :8080
       ▼
 Spring Boot REST API (:8080)
       │
       │  JDBC / JPA
       ▼
 PostgreSQL 16 (:5432)
 Flyway migrations
```

The frontend is a React SPA served by Vite. All `/api` requests get proxied to the backend (port 8080). The backend accepts JSON, validates it, and responds with JSON. Data lives in Postgres with schema managed by Flyway migrations (V1–V72).

Auth: on login, the backend returns a JWT. The frontend stores it in memory (AuthContext) and attaches it as `Authorization: Bearer <token>` on every request. Spring Security verifies it on every protected endpoint.

### Tech stack — why these choices

| Layer      | Tech                        | Why                                                                                     |
| ---------- | --------------------------- | --------------------------------------------------------------------------------------- |
| Frontend   | React 19 + Vite 7           | SPA, fast HMR during development, lazy-loaded pages                                     |
| Styling    | Custom CSS + CSS variables  | Full control over theming, dark/light mode without a library                            |
| Backend    | Spring Boot 3.5.x, Java 17  | Battle-tested enterprise stack, lots of built-in mechanisms (security, validation, JPA) |
| ORM        | Spring Data JPA + Hibernate | Didn't want to write raw SQL for every basic operation                                  |
| Migrations | Flyway                      | Schema versioning, migration history, predictable state                                 |
| Auth       | JWT (JJWT 0.12)             | Stateless — no server-side session storage needed                                       |
| Database   | PostgreSQL 16               | JSONB for flexible character data, solid FK support and indexing                        |
| Infra      | Docker Compose              | One command to spin up the database and backend locally                                 |

### Running it locally

**Requirements:**

| Tool                | Version |
| ------------------- | ------- |
| Node.js             | 20+     |
| Java JDK            | 17+     |
| Docker + Compose v2 | 24+     |

**Setup:**

```bash
# 1. Clone the repo
git clone <repo-url>
cd ttrpg-assistant

# 2. Set up environment variables
cp .env.example .env
# Open .env and fill in the values — details in .env.example

# 3. Build backend JAR
cd backend
mvn -q -DskipTests package

# 4. Start the database and backend
cd ../infra
docker compose up -d --build

# 5. Start the frontend
cd ../frontend
npm install
npm run dev
```

**Check it's working:**

```bash
curl http://localhost:8080/api/health   # should return: OK
# Frontend: http://localhost:5173
```

Register an account at `/register` — if the dashboard loads, everything is working.

**Useful during development:**

```bash
# Stream backend logs
docker logs ttrpg_backend -f --tail 50

# Connect to the database
docker exec -it ttrpg_db psql -U ttrpg -d ttrpg

# Rebuild backend after code changes
cd backend && mvn -q -DskipTests package
cd ../infra && docker compose up -d --build backend
```

**Backend Docker workflow (always fresh JAR):**

```bash
cd backend
mvn -q -DskipTests package
cd ../infra
docker compose down
docker compose up -d --build
```

If backend runs stale code, the most common cause is skipping `mvn package` before compose build (Dockerfile copies `target/*.jar`).

**Code verification:**

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd ../backend
mvn test
```

### Frontend tests

- Stack:
  - Vitest (`jsdom`)
  - React Testing Library
  - `@testing-library/jest-dom`
- Run:
  - `cd frontend`
  - `npm run test`
- Test structure (`frontend/src/__tests__`), grouped by domain:
  - `auth/` (`AuthContext.test.jsx`, `authstorage.test.js`)
  - `api/` (`campaigns.test.js`)
  - `pages/initiative/` (`InitiativePage`, `initiativeUtils`, and panel tests)
- Current coverage:
  - auth storage helpers (`getToken`, `setToken`, `clearToken`)
  - AuthContext token initialization and unauthorized/logout handling
  - representative campaigns API helpers (encounters, participant mutations, dice roll helpers)
  - lightweight InitiativePage smoke cases (loading / empty encounters / participant render)
  - initiative formatting helpers (`HP`, participant status, roll summary)
- TODO:
  - expand InitiativePage tests after splitting it into smaller components
  - add more isolated UI state tests for error and disabled-button flows

### Project structure

```
ttrpg-assistant/
├── backend/src/main/java/pl/ttrpgassistant/backend/
│   ├── auth/           # registration, login, JWT
│   ├── campaign/       # campaigns, sessions, materials, messages, notes
│   ├── character/      # player characters (JSONB)
│   ├── generator/      # seed/algorithm generators
│   ├── security/       # JwtAuthFilter, SecurityConfig
│   ├── social/         # friends, blocking, public profiles
│   ├── user/           # account settings, activity tracking
│   └── common/error/   # GlobalExceptionHandler → consistent HTTP errors
│
├── backend/src/main/resources/
│   ├── application.yml             # config via environment variables
│   └── db/migration/V1–V72*.sql    # full schema history
│
├── frontend/src/
│   ├── api/        # thin fetch wrappers, one file per module
│   ├── auth/       # AuthContext, ProtectedRoute
│   ├── pages/      # ~14 pages, all lazy loaded
│   └── styles/     # per-page CSS + theme.css (CSS variables)
│
└── infra/
    └── docker-compose.yml   # PostgreSQL 16 + backend container
```

### Database — main tables

```
users                     accounts, roles, profile settings
campaigns                 campaigns (owner, join code, status)
campaign_members          who's in a campaign and with what role (gm/player)
campaign_sessions         sessions (scheduled → started → finished)
campaign_session_notes    notes per session, per user
campaign_materials        links and descriptions of session materials
player_characters         characters + character_data_json (JSONB)
friendships               friendship relations
friend_requests           invites (pending/accepted/rejected)
generator_pools           data pools for seed-based generators
monsters / glossary_terms static data (monster db, TTRPG glossary)
```

### Common startup issues

| Error                         | Cause                                                        | Fix                                                                                   |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `Invalid CORS request`        | Frontend port doesn't match `CORS_ALLOWED_ORIGINS` in `.env` | Update `.env`, restart backend                                                        |
| `HTTP 500` on register        | Backend down or database not ready                           | `docker ps`, check logs                                                               |
| Blank white page              | JS error                                                     | F12 → Console                                                                         |
| `401 Unauthorized` everywhere | Expired token                                                | Log out and log back in                                                               |
| Flyway error on startup       | Migration version conflict                                   | `SELECT * FROM flyway_schema_history` — find the mismatch                             |
| Backend runs stale code       | Dockerfile copies `target/*.jar` and the jar was not rebuilt | Before `docker compose up -d --build`, run `cd backend && mvn -q -DskipTests package` |

### Known limitations and technical TODOs

- Tests now cover backend and frontend flows, but integration and end-to-end coverage can still be expanded.
- Frontend is plain JavaScript — no TypeScript, no PropTypes
- No Swagger/OpenAPI — endpoints are only documented in the controller files
- `tailwindcss` is in `package.json` but was never actually used
- The backend uses stable Spring Boot `3.4.1`; keep future upgrades on stable releases instead of snapshots
- JWT is stored in frontend `localStorage`, which is convenient locally but needs XSS care in production

### Initiative and Rules scope (v0.7.5+)

- `/initiative` is now a quick local GM combat tracker (browser localStorage only).
- `/initiative` does not require campaign or session context and does not persist encounters to backend.
- `LiveSessionPage` does not contain initiative preview in MVP.
- Backend combat encounter endpoints remain available as legacy/future API, but the global `/initiative` page no longer manages them.
- Character sheet PDF export is deferred/future work in the current MVP.
- `/rules` and `/compendium` are safe MVP foundations that prioritize legal sources and links over full rulebook replication.
- Multi-system full compendium coverage is future work.
- Compendium legal-source analysis: `docs/COMPENDIUM_DATA_SOURCES.md`.

### Rules Unification (v0.7.6)

- `RulesPage` has a unified structure across supported systems as a \"basic rules to start playing\" module.
- The app presents only local summaries, legal links, and minimal onboarding context.
- Full rulebooks are not copied or replicated inside the app.
- Systems without verified licensing/data status are marked as `requires-verification` and shown with neutral guidance.
- Source/legal strategy and risk notes are tracked in `docs/COMPENDIUM_DATA_SOURCES.md`.

---

_Engineering thesis project · 2025_

## Campaign Management Core (v0.6.0)

- `GET /api/campaigns` lists visible campaigns (owner/member, excluding soft-deleted).
- `GET /api/campaigns/{id}` returns details only for owner/member.
- `POST /api/campaigns` creates campaign.
- `PATCH /api/campaigns/{id}` updates campaign core data (owner only).
- `DELETE /api/campaigns/{id}` soft-deletes campaign (owner only, returns `204`).
- `POST /api/campaigns/join` joins by code; deleted campaign codes return `404`.

Role rules:

- Owner can update/delete campaign and create/start/finish sessions.
- Member can view campaign and workspace data.
- Non-member cannot view private campaign details or modify campaign/session state.

Soft-delete behavior:

- API sets `campaigns.deleted_at` and keeps DB row.
- Deleted campaigns disappear from list and details endpoints.
- Session endpoints on deleted campaign return `404`.
- Join code uniqueness is partial for active rows only (`deleted_at IS NULL`), so deleted code can be reused.

Status rules:

- Campaign status values: `active`, `finished`, `archived` (validated in DB + entity guard).
- Session status values: `PLANNED`, `IN_PROGRESS`, `FINISHED`.
- Allowed flow: `PLANNED -> IN_PROGRESS -> FINISHED`.
- Re-starting finished session or finishing non-`IN_PROGRESS` session returns `400`.

### Campaign Character Assignment (v0.6.1)

- `campaign_characters` links campaign and player character without exposing `sheet_json` in list APIs.
- Endpoints:
  - `POST /api/campaigns/{campaignId}/characters`
  - `GET /api/campaigns/{campaignId}/characters`
  - `DELETE /api/campaigns/{campaignId}/characters/{characterId}` (soft detach)
- Assign rules:
  - owner/member can assign only their own character;
  - non-member cannot assign;
  - deleted campaign cannot accept assignments.
- Detach rules:
  - owner can detach any campaign character;
  - member can detach only own character;
  - non-member has no access.
- List returns active assignments only (`is_active = true`) with character summary fields.
- Current scope intentionally excludes persistent initiative, HP/state tracking, and status automation.

### Persistent Initiative Tracker (v0.6.2)

- Initiative is persisted per campaign in:
  - `combat_encounters` (encounter metadata, status, turn pointer, round)
  - `combat_participants` (ordered participants, optional linked character)
- Encounter status: `ACTIVE`, `FINISHED`, `ARCHIVED`.
- Participant type: `PLAYER_CHARACTER`, `NPC`, `MONSTER`, `CUSTOM`.
- Turn logic:
  - `next-turn` moves to next active/non-defeated participant.
  - wrapping to first participant increments `roundNumber`.
  - `previous-turn` moves backwards and can decrease round when wrapping.
- Access:
  - owner manages encounters and participants.
  - member can read encounters.
  - non-member has no access.
- Current limits:
  - no persistent HP damage ledger,
  - no condition tracking yet,
  - no full combat manager automation.
- Planned next step: session HP and condition tracking foundation.

### Session HP & Conditions Foundation (v0.6.3)

- `combat_participants` now supports optional state fields:
  - `max_hp`, `current_hp`, `temp_hp`, `armor_class`, `conditions`,
  - `death_save_successes`, `death_save_failures`.
- New participant state endpoints:
  - `POST /api/campaigns/{campaignId}/encounters/{encounterId}/participants/{participantId}/damage`
  - `POST /api/campaigns/{campaignId}/encounters/{encounterId}/participants/{participantId}/heal`
  - `POST /api/campaigns/{campaignId}/encounters/{encounterId}/participants/{participantId}/temporary-hp`
  - `POST /api/campaigns/{campaignId}/encounters/{encounterId}/participants/{participantId}/conditions`
  - `POST /api/campaigns/{campaignId}/encounters/{encounterId}/participants/{participantId}/defeat`
  - `POST /api/campaigns/{campaignId}/encounters/{encounterId}/participants/{participantId}/restore`
- Rules:
  - damage consumes `temp_hp` first, then `current_hp`,
  - `current_hp` never drops below `0`,
  - reaching `current_hp = 0` sets `isDefeated = true` (MVP behavior),
  - healing requires both `current_hp` and `max_hp`, caps at `max_hp`,
  - healing above `0` clears defeated state,
  - temporary HP endpoint sets value directly (overwrite, no stacking),
  - conditions are stored as plain text (no automatic rule interpretation).
- Access and mutability:
  - owner can mutate HP/conditions/defeated state,
  - members can read encounter state but cannot mutate,
  - non-members have no access,
  - state mutation is blocked when encounter is `FINISHED`.
- Current intentional limits:
  - no automatic D&D/CoC rules automation,
  - no separate conditions table,
  - no damage/action history log,
  - no full combat manager UI redesign.

### Dice Roll History (v0.6.4)

- Added persistent dice roll log in `dice_rolls` with optional links to:
  - campaign session (`session_id`),
  - combat encounter (`encounter_id`),
  - encounter participant (`participant_id`),
  - character (`character_id`).
- Supported roll expressions (MVP parser):
  - `d20`, `1d20`, `2d6`, `2d6+3`, `1d20-1`, `4d6+2`, `d100`.
- Parser limits:
  - max 20 dice per roll,
  - max die size `d1000`,
  - modifier range `-1000..1000`,
  - one simple expression only (`XdY±M`).
- Roll type values:
  - `GENERIC`, `ATTACK`, `DAMAGE`, `SAVE`, `SKILL`, `INITIATIVE`, `CUSTOM`.
- Privacy rules:
  - `isPrivate=false`: visible to campaign owner and members,
  - `isPrivate=true`: visible to campaign owner and roll author only.
- API:
  - `POST /api/campaigns/{campaignId}/dice-rolls` (execute + persist),
  - `GET /api/campaigns/{campaignId}/dice-rolls`,
  - `GET /api/campaigns/{campaignId}/dice-rolls/{rollId}`,
  - `DELETE /api/campaigns/{campaignId}/dice-rolls/{rollId}` (soft-delete).
- Current MVP limits:
  - no advantage/disadvantage automation,
  - no Fate/Fudge dice support in backend parser,
  - no Genesys dice support in backend parser,
  - no auto-integration into initiative/damage workflows,
  - no large dedicated UI for persistent roll history yet.

### Initiative UI Backend Integration (v0.6.4)

- `InitiativePage` now works in persistent backend mode:
  - select campaign,
  - list/select/create/finish/delete encounters,
  - load encounter participants with turn/round state from backend.
- UI supports participant actions:
  - add custom participant,
  - add assigned campaign character as participant,
  - next/previous turn,
  - remove participant,
  - HP/state updates (`damage`, `heal`, `temp HP`, `conditions`, `defeat`, `restore`).
- UI includes a basic campaign/encounter dice history panel:
  - execute simple expression roll,
  - show recent rolls (expression, total, label, author, timestamp),
  - refresh history after roll.
- Loading/error/empty states are included for campaigns, encounters, participants, and roll history.
- Current frontend scope limits:
  - no final combat manager UI polish,
  - no global redesign,
  - no automatic D&D/CoC rules automation,
  - dice rolls are not auto-applying damage or initiative effects.

Refactor note (v0.6.6):

- `InitiativePage` was split into smaller components under `frontend/src/pages/initiative/components/`.
- Persistent combat UI behavior remains functionally the same.
- Frontend tests now cover basic initiative components and utility helpers.

### Live Session Architecture Draft (v0.6.6)

- Design document for future active-session workspace is available in `LIVE_SESSION_ARCHITECTURE.md`.
- `DicePage` and `InitiativePage` remain global tools available across the app.
- Future `LiveSessionPage` will use embedded roll/initiative panels in active-session context (instead of requiring navigation to `/dice` or `/initiative` for core session actions).
- Scope is architecture/planning only (no migrations, no new endpoints, no LiveSessionPage implementation in this stage).

### Initiative Structure Simplification & Live Session Architecture Draft (v0.6.7)

- Initiative frontend was reorganized into a simpler structure with 3 main panels:
  - `CampaignEncounterPanel` (campaign + encounter controls),
  - `ParticipantsPanel` (participants table + participant add forms),
  - `DiceRollPanel` (quick roll + recent history).
- Functionality and backend contract remain unchanged:
  - same endpoints,
  - same access rules,
  - same persisted encounter/participant/dice behavior.
- Legacy tiny initiative components were removed to reduce component fragmentation.
- A forward architecture draft for `LiveSessionPage` was added in `LIVE_SESSION_ARCHITECTURE.md`.
- Test scope for initiative UI now targets these larger panels plus page smoke/utils tests.

### Campaign Workspace Refactor (v0.6.8)

- `CampaignDetailPage` is now organized as a campaign workspace orchestration layer with focused panels:
  - overview,
  - campaign characters,
  - campaign sessions,
  - campaign materials.
- `/dice` and `/initiative` remain global tools available across the application.
- Future `LiveSessionPage` remains a separate active-session room with embedded session panels (see `LIVE_SESSION_ARCHITECTURE.md`).

### LiveSessionPage Foundation (v0.6.8)

- Added route: `/campaigns/:campaignId/sessions/:sessionId/live`.
- Added `LiveSessionPage` MVP foundation for active session room.
- `LiveSessionPage` currently includes:
  - campaign/session header and back link to campaign workspace,
  - party/players panel based on campaign characters,
  - role split (`GM/owner` vs `member/player`) in basic form,
  - initial MVP sections for Scene panel, Requested Rolls, Initiative Preview (later expanded in v0.6.9+ / v0.7.x),
  - lightweight session roll history preview.
- `/dice` and `/initiative` remain global off-session tools.
- At this v0.6.8 checkpoint, embedded requested rolls logic, scene persistence, and initiative embedding were still deferred to later stages.

### Session Live State & Scene Panel (v0.6.9)

- Added DB table: `session_live_state` (one row per session via unique `session_id`).
- Added live-state endpoints:
  - `GET /api/campaigns/{campaignId}/sessions/{sessionId}/live-state`
  - `PATCH /api/campaigns/{campaignId}/sessions/{sessionId}/live-state`
- Access rules:
  - owner/member can read,
  - owner can update,
  - member has read-only access.
- LiveSessionPage Scene Panel now uses backend live state:
  - owner: inline scene form (`sceneTitle`, `sceneImageUrl`, `sceneDescription`),
  - member: read-only scene view.
- MVP image model supports unified local file upload (`/api/uploads/images`) and URL fallback.
- No WebSocket/SSE live sync in this stage (future polling/SSE/WebSocket planned).

### Campaign System Compatibility (v0.7.0)

- Campaign `systemCode` is treated as source of truth for assignment compatibility.
- Character assignment to campaign is filtered and validated by system:
  - compatible system: assignment allowed,
  - incompatible system: assignment blocked (backend-enforced).
- Campaign characters assignment UI now shows only compatible character options.
- If a user has characters but none match campaign system, UI shows:
  - `Brak postaci zgodnych z systemem tej kampanii.`

### Campaign Dashboard Direction (Planned)

- `CampaignDetailPage` is evolving toward mini dashboard responsibilities:
  - overview,
  - upcoming session,
  - players/members and assigned characters,
  - attendance status (future),
  - player notes (future),
  - materials,
  - active session entrypoint.
- Global tools (`/dice`, `/initiative`) stay in app sidebar and are not duplicated as a campaign dashboard panel.

### Session Attendance Voting (v0.7.2)

- Added attendance voting per campaign session.
- Player/member can set own status:
  - `AVAILABLE`
  - `MAYBE`
  - `UNAVAILABLE`
- Lack of response is represented as `no response` (no attendance row for that user/session).
- GM/owner and members can read attendance summary for campaign session context.
- Attendance endpoints:
  - `GET /api/campaigns/{campaignId}/sessions/{sessionId}/attendance`
  - `PUT /api/campaigns/{campaignId}/sessions/{sessionId}/attendance/me`

### Dashboard & Notifications Consistency (v0.7.3)

- Main dashboard now renders real campaign session data:
  - upcoming sessions come from user campaigns (`PLANNED`, sorted by date),
  - active-session hero is based on real `IN_PROGRESS` sessions.
- Main dashboard no longer duplicates global initiative actions.
- Global tools remain in sidebar:
  - `/dice`
  - `/initiative`
- Notifications support core actions from bell panel:
  - mark one as read,
  - mark all as read,
  - delete one,
  - clear all.

### Player Campaign Notes (v0.7.3)

- Campaign dashboard now supports player campaign notes.
- Visibility:
  - player/member sees only own notes,
  - GM/owner sees all notes in campaign.
- Notes are campaign-scoped (not session-scoped yet).
- MVP limitations:
  - plain textarea editor only,
  - no rich text formatting.

### Active Session Lifecycle (v0.7.4)

- Campaign sessions follow lifecycle:
  - `PLANNED -> IN_PROGRESS -> FINISHED`.
- Only GM/owner can start and finish session lifecycle transitions.
- Live session mechanics are active only for `IN_PROGRESS` sessions.
- `PLANNED` and `FINISHED` sessions are treated as not-active for live mechanics.

### Requested Rolls (v0.7.5)

- GM/owner can create requested rolls in `LiveSessionPage` for:
  - one/many characters (`CHARACTER`),
  - one/many users (`USER`),
  - all assigned compatible characters (`ALL`).
- Players execute requested rolls directly in `LiveSessionPage` (without navigating to `/dice`).
- Fulfilled requested rolls are persisted to `dice_rolls` with campaign/session context.
- DC visibility rules:
  - GM always sees DC and success/failure,
  - player sees DC only when not hidden,
  - player sees success/failure only when enabled.
- Requested rolls are active only for `IN_PROGRESS` sessions.

## Security (MVP v0.5.4)

- JWT is currently stored in localStorage (`ttrpg_token`) for MVP simplicity.
- Added hardening: CSP + frame deny + safe image/data URL validation + auth rate limiting + no token logging.
- Rate limiter uses server-observed client IP (`remoteAddr`) and ignores spoofed X-Forwarded-For in current MVP mode.
- HttpOnly cookie migration is intentionally postponed to a future phase to avoid breaking auth flow in this release.
- Manual smoke: register (min 8 password), invalid login (generic 401), protected endpoint 401/200 checks, ownership checks for characters/campaigns.

### Password Reset (v0.5.5)

- Added endpoints: POST /api/auth/forgot-password and POST /api/auth/reset-password.
- Forgot password always returns a neutral response to avoid account enumeration.
- Reset tokens are stored hashed in DB (password_reset_tokens) with expiration and single-use flag.
- Token delivery by email is TODO for future infrastructure; for tests/dev it can be exposed via EXPOSE_RESET_TOKEN=true.
- Added users.token_invalidated_at: after password change/reset, older JWTs (issued before invalidation time) are rejected.


### Live Session Initiative Scope (v0.7.5)

- Embedded initiative preview in `LiveSessionPage` is disabled in MVP.
- `/initiative` is the only initiative UI in current MVP and works locally (`localStorage`).
- Backend encounter endpoints remain available for future campaign-linked initiative work.

### Quick Initiative Tracker (v0.7.3)

- `/initiative` is a global MG tool for fast at-table combat tracking.
- Works locally in browser storage (`localStorage`) and restores after page refresh.
- Does not require campaign selection.
- Does not require session selection.
- Does not save encounters to backend API.
- Intended as fast initiative/HP/conditions/notes helper during play.

### D&D Initiative Tracker Upgrade (v0.7.6)

- `/initiative` now uses modal-based participant creation (custom participant or D&D monster lookup).
- D&D monster lookup is powered by backend proxy endpoints (SRD API source), not direct frontend external calls.
- Conditions list is loaded from D&D API via backend and falls back to local condition list if unavailable.
- Added initiative roll (`d20 + initiative modifier`) for all participants.
- Added manual queue controls (`Sortuj po inicjatywie`, `↑`, `↓`) and improved HP operations (`Obrazenia`, `Leczenie`, `Ustaw HP`).

### Character Sheet PDF Export (deferred)

- Export karty postaci do PDF jest tymczasowo wylaczony z aktualnego MVP.
- Endpoint `/api/characters/{characterId}/sheet.pdf` i zaleznosc PDFBox zostaly usuniete, zeby utrzymac zielona walidacje backendu.
- PDF export pozostaje future work po ustaleniu stabilnego generatora i szablonow.

### RulesPage Cleanup (v0.7.6.1)

- MVP `RulesPage` currently supports only:
  - D&D 5e
  - Call of Cthulhu 7e
  - Warhammer 4e
  - Pathfinder 2e
  - Mork Borg
- Legacy local reference entries list and its search UI were removed from `RulesPage` to keep the view focused on unified basic summaries.
- Savage Worlds and Alien RPG were intentionally disabled on `RulesPage` until source/licensing verification and support scope are confirmed.

### Official Starter Resources (v0.7.3)

- `RulesPage` now links to official starter resources for each supported MVP system instead of hosting external rulebook PDFs locally.
- The app provides link-based access to legal starter materials (SRD, quickstart pages, official resource hubs) and keeps local content as summaries.
- WFRP 4e is explicitly presented as official resources only (no full free SRD in MVP).

### v0.7.4 - Dashboard content and social suggestions
- Dashboard panel Ostatnio wygenerowane pokazuje ostatnie wpisy generatorow (MVP: localStorage, klucz 	trpg.generatorHistory).
- Strona generatorow nie renderuje juz sekcji Ostatnio wygenerowane; historia jest przeniesiona na Dashboard.
- Modul znajomych zawiera sekcje Proponowane z sugestiami relacji na podstawie wspolnych kampanii i znajomych znajomych.
- Dodano endpoint GET /api/social/suggestions do pobierania sugestii dla zalogowanego uzytkownika.

### v0.7.4 - Clean dashboard information architecture
- Dashboard jest ekranem statusowym i nie dubluje globalnej nawigacji z sidebara.
- KPI obejmuja: Kampanie, Postacie, Nadchodzace sesje, Sesje.
- KPI Materialy zostalo usuniete do czasu wdrozenia realnego modulu materialow.
- Hero aktywnej sesji pokazuje wylacznie sesje `IN_PROGRESS`; gdy brak, renderowany jest neutralny stan.
- Panel Nadchodzace sesje pokazuje tylko `PLANNED`, posortowane rosnaco i ograniczone do 3 rekordow.
- Panel Szybkie akcje zostal usuniety.
- Panel Zalegle notatki przygotowuje miejsce pod przyszle archiwum notatek sesyjnych.
- Panel Ostatnio wygenerowane pozostaje na Dashboardzie i korzysta z `localStorage` (`ttrpg.generatorHistory`).

### v0.7.5 - Session notes archive and dashboard backlog
- Dodano prywatne notatki posesyjne uzytkownika (`session_player_notes`) per sesja i per uzytkownik.
- API notatek posesyjnych:
  - `GET /api/campaigns/{campaignId}/sessions/{sessionId}/notes/me`
  - `PUT /api/campaigns/{campaignId}/sessions/{sessionId}/notes/me`
  - `DELETE /api/campaigns/{campaignId}/sessions/{sessionId}/notes/me`
- Dodano dashboard backlog:
  - `GET /api/dashboard/session-note-backlog`
  - zwraca zakonczone sesje (`FINISHED`) bez notatki biezacego uzytkownika.
- W `CampaignSessionsPanel` sesje `FINISHED` maja akcje `Moje notatki` (modal zapisu/usuwania).
- Dane notatek sa prywatne dla uzytkownika i nie sa udostepniane innym czlonkom kampanii.

### v0.7.5 - Add unified image upload support
- Dodano endpoint uploadu obrazow: `POST /api/uploads/images` (multipart/form-data, field `file`).
- Publiczny odczyt obrazow jest dostepny przez `GET /uploads/images/{filename}`.
- Walidacja uploadu:
  - typy: `image/jpeg`, `image/png`, `image/webp`
  - limit rozmiaru: 5 MB
  - nazwa pliku: bezpieczna (`UUID + rozszerzenie`).
- Storage: lokalny katalog backendu (`uploads/images`).
- Upload zostal podlaczony do kluczowych miejsc UI:
  - avatar profilu,
  - okladka kampanii (tworzenie/edycja),
  - portret postaci (D&D i CoC),
  - obraz sceny Live Session.
- Wklejenie URL obrazu pozostaje dostepne jako opcjonalna sciezka.
- Integracje z zewnetrznym storage (S3/Cloudinary) sa celowo odlozone (future work).

### v0.7.7 - Rework campaign detail into GM and player dashboard
- `CampaignDetailPage` renderuje dwa warianty widoku zalezne od roli uzytkownika:
  - `MG Dashboard` dla wlasciciela kampanii,
  - `Player Dashboard` dla uczestnika kampanii.
- Wspolny header kampanii pokazuje kluczowe informacje: tytul, opis, system, status/widocznosc i okladke.
- Widok MG skupia sie na zarzadzaniu:
  - najblizsza sesja,
  - pelna lista sesji i tworzenie sesji,
  - gracze, postacie kampanii, notatki graczy,
  - panel kodu zaproszenia.
- Widok gracza jest uproszczony:
  - najblizsza sesja,
  - moja postac,
  - ostatnie zakonczone sesje z akcja `Moje notatki`,
  - uczestnicy i podstawowe informacje o kampanii.
- Usunieto martwy panel placeholder `Frekwencja / Glosowanie` z widoku szczegolow kampanii.

### v0.7.8 - Rework LiveSession into GM and player views
- `LiveSessionPage` renderuje dwa czytelne warianty:
  - `GM Live Session View` (owner),
  - `Player Live Session View` (member).
- Wspolny header pokazuje: kampanie, sesje, status (`PLANNED`/`IN_PROGRESS`/`FINISHED`) i powrot do kampanii.
- Akcje lifecycle sesji:
  - MG: `Rozpocznij sesje` dla `PLANNED`, `Zakoncz sesje` dla `IN_PROGRESS`,
  - gracz: bez akcji start/finish.
- Widok MG:
  - edycja sceny (tytul, obraz URL/upload, opis),
  - lista `Party / Players`,
  - requested rolls z uproszczonym formularzem (basic + advanced),
  - aktywne requested rolls i anulowanie,
  - historia rzutow sesji.
- Widok gracza:
  - scena read-only,
  - moja postac (lub neutralny empty state),
  - tylko moje requested rolls + `Wykonaj rzut`,
  - historia rzutow,
  - po `FINISHED` CTA `Dodaj notatki po sesji`.
- Initiative preview pozostaje poza MVP i nie jest renderowane w LiveSession.

### v0.7.9 - Add character JSON import and export
- Dodano eksport postaci do JSON:
  - `GET /api/characters/{characterId}/export`
  - payload zawiera wersje eksportu, timestamp i dane postaci (w tym `sheetJson`).
- Dodano import postaci z JSON:
  - `POST /api/characters/import`
  - import tworzy nowa postac na koncie aktualnego uzytkownika (bez nadpisywania istniejacej).
- Walidacja importu obejmuje:
  - wymagane pola (`character`, `name`, `systemCode`, `sheetJson`),
  - obslugiwane systemy: `dnd5e`, `coc7e`,
  - limit rozmiaru `sheetJson` payload.
- Frontend dodaje akcje `Eksportuj JSON` i `Importuj JSON` w module postaci.
- Import z zewnetrznych serwisow (np. D&D Beyond) pozostaje poza MVP.

### v0.7.10 - Polish character management flow
- `/characters` ma dopracowany flow MVP dla D&D 5e i CoC 7e bez placeholderow `coming soon`.
- Sidebar postaci zawiera spojne akcje: `Nowa postac`, `Importuj JSON`, `Eksportuj JSON`, `Drukuj`.
- Po usunieciu postaci lista odswieza sie i usuniety rekord nie zostaje zaznaczony.
- Widok D&D uzywa ujednoliconych sekcji: `Atrybuty`, `Walka`, `Rzuty obronne`, `Umiejetnosci`, `Cechy i zdolnosci`, `Zaklecia`, `Ekwipunek`, `Notatki`.
- Widok CoC uzywa ujednoliconych sekcji: `Cechy`, `Statystyki pochodne`, `Umiejetnosci`, `Walka`, `Ekwipunek`, `Historia postaci`, `Notatki`.
- Import/export JSON i print-friendly flow pozostaja aktywne; backendowy eksport PDF pozostaje poza MVP.

### v0.7.11 - Clean social pages UX
- Social MVP pozostaje prosty: `Znajomi`, `Zaproszenia`, `Proponowane`, `Blokady` oraz wiadomosci 1:1.
- Zakladka `Proponowane` pokazuje tylko realne sugestie z backendu wraz z powodem (`Wspolna kampania`, `Znajomy znajomego`, `Proponowany gracz`).
- Wyszukiwanie uzytkownikow jest osobne i nie miesza sie z lista sugerowanych.
- `Messages` utrzymuje layout: lista rozmow + glowny chat; panel szczegolow jest widoczny tylko dla realnie wybranego kontaktu.
- Dodane czytelne empty states dla braku rozmow, braku wynikow, braku wiadomosci i rozmow oczekujacych na akceptacje.

### v0.8.0 - Rework dashboard widgets and session overview
- Dashboard ma jeden glowny panel sesji:
  - priorytet `IN_PROGRESS` jako `Aktywna sesja`,
  - fallback do najblizszej `PLANNED` jako `Najblizsza sesja`,
  - empty state gdy brak sesji aktywnej i planowanej.
- Dla sesji `PLANNED` dashboard pokazuje countdown (`dni`, `godziny`, `minuty`), a dla `IN_PROGRESS` status `Sesja trwa`.
- KPI zostaly zastapione rozwijanymi kafelkami opartymi o realne dane:
  - `Kampanie` (listCampaigns),
  - `Postacie` (listCharacters),
  - `Nadchodzace sesje` (`PLANNED` z listCampaignSessions),
  - `Ostatnie sesje` (`FINISHED` z listCampaignSessions).
- Dodano panele:
  - `Systemy RPG` (agregacja `systemCode` dla kampanii i postaci),
  - `Dostepnosc graczy` (attendance najblizszej sesji `PLANNED`),
  - `Twoja rola` (kampanie jako MG/gracz).
- Dashboard nie renderuje mockow ani placeholderowych rekordow; brak danych oznacza realny empty state, a nie sztuczne demo wpisy.
- Usunieto osobny duzy panel `Nadchodzace sesje` oraz placeholderowy panel backlogu notatek z tego widoku.

### v0.8.0.1 - Improve dashboard layout scale and remove recent generated panel
- Glowny panel sesji (`Aktywna sesja` / `Najblizsza sesja`) ma nizsza, bardziej panoramiczna proporcje i bardziej zwarty uklad tresci.
- Dashboard nie renderuje juz panelu `Ostatnio wygenerowane`; prawa kolumna zawiera: `Dostepnosc graczy`, `Systemy RPG`, `Twoja rola`.
- Logika danych pozostaje bez zmian: dashboard nadal opiera sie na realnych danych kampanii/postaci/sesji/attendance bez mockow i placeholderow.

### v0.8.1 - Clean settings page structure
- `/settings` zostalo uproszczone do ukladu dwukolumnowego: `menu kategorii` + `tresc ustawien`.
- Usunieto prawy rail i panele pomocnicze (profil, szybki dostep, status, panel MG).
- Usunieto gorne taby i dodatkowe elementy nawigacji, ktore nie wnosily realnej logiki ustawien.
- Sekcje ustawien sa skupione na realnych funkcjach: `Konto`, `Bezpieczenstwo`, `Wyglad`, `Chat sesji`, `Dane lokalne`, `Strefa ryzyka`.
- Ustawienie koloru nicku pozostaje w `Chat sesji`, a `Wyglad` zawiera tylko wybor motywu aplikacji.

