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

Frontend to React SPA serwowany przez Vite. Wszystkie requesty do `/api` Vite proxy'uje na backend (port 8080). Backend to Spring Boot — przyjmuje JSON, waliduje, odpowiada JSON. Dane siedzą w Postgresie, schemat zarządzany przez Flyway (migracje V1–V61).

Auth: po zalogowaniu backend zwraca JWT. Frontend trzyma go w pamięci (AuthContext) i dokłada do każdego requesta jako `Authorization: Bearer <token>`. Spring Security weryfikuje go na każdym endpoincie.

### Stack — dlaczego akurat to

| Co | Czym | Dlaczego |
|----|------|----------|
| Frontend | React 19 + Vite 7 | SPA, szybkie HMR podczas developmentu, lazy loading stron |
| Styling | Custom CSS + CSS variables | Pełna kontrola nad motywem, dark/light bez biblioteki |
| Backend | Spring Boot 3.5.x, Java 17 | Sprawdzony enterprise stack, dużo gotowych mechanizmów (security, walidacja, JPA) |
| ORM | Spring Data JPA + Hibernate | Nie chciałem pisać SQL ręcznie dla podstawowych operacji |
| Migracje | Flyway | Wersjonowanie schematu, rollback, historia zmian |
| Auth | JWT (JJWT 0.12) | Bezstanowe, nie trzeba trzymać sesji po stronie serwera |
| Baza | PostgreSQL 16 | JSONB dla elastycznych danych postaci, solidne FK i indeksy |
| Infra | Docker Compose | Żeby backend + baza działały jedną komendą lokalnie |

### Uruchomienie lokalne

**Wymagania:**

| Narzędzie | Wersja |
|-----------|--------|
| Node.js | 20+ |
| Java JDK | 17+ |
| Docker + Compose v2 | 24+ |

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
│   └── db/migration/V1–V61.sql     # cała historia schematu
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

| Błąd | Przyczyna | Fix |
|------|-----------|-----|
| `Invalid CORS request` | Port frontendu nie zgadza się z `CORS_ALLOWED_ORIGINS` w `.env` | Zaktualizuj `.env`, zrestartuj backend |
| `HTTP 500` przy rejestracji | Backend nie działa lub baza nie jest gotowa | `docker ps`, sprawdź logi |
| Biała pusta strona | Błąd JS | F12 → Console |
| `401 Unauthorized` wszędzie | Wygasły token | Wyloguj i zaloguj ponownie |
| Flyway error przy starcie | Konflikt wersji migracji | `SELECT * FROM flyway_schema_history` — znajdź co się nie zgadza |
| Backend działa na starym kodzie | Dockerfile kopiuje `target/*.jar`, a JAR nie został przebudowany | Przed `docker compose up -d --build` uruchom `cd backend && mvn -q -DskipTests package` |

### Znane ograniczenia i TODO techniczne

- Testy są nadal minimalne — obecnie jest tylko prosty sanity test klasy aplikacji, bez testu kontekstu Spring i bez bazy
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

The frontend is a React SPA served by Vite. All `/api` requests get proxied to the backend (port 8080). The backend accepts JSON, validates it, and responds with JSON. Data lives in Postgres with schema managed by Flyway migrations (V1–V61).

Auth: on login, the backend returns a JWT. The frontend stores it in memory (AuthContext) and attaches it as `Authorization: Bearer <token>` on every request. Spring Security verifies it on every protected endpoint.

### Tech stack — why these choices

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React 19 + Vite 7 | SPA, fast HMR during development, lazy-loaded pages |
| Styling | Custom CSS + CSS variables | Full control over theming, dark/light mode without a library |
| Backend | Spring Boot 3.5.x, Java 17 | Battle-tested enterprise stack, lots of built-in mechanisms (security, validation, JPA) |
| ORM | Spring Data JPA + Hibernate | Didn't want to write raw SQL for every basic operation |
| Migrations | Flyway | Schema versioning, migration history, predictable state |
| Auth | JWT (JJWT 0.12) | Stateless — no server-side session storage needed |
| Database | PostgreSQL 16 | JSONB for flexible character data, solid FK support and indexing |
| Infra | Docker Compose | One command to spin up the database and backend locally |

### Running it locally

**Requirements:**

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| Java JDK | 17+ |
| Docker + Compose v2 | 24+ |

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
│   └── db/migration/V1–V61.sql     # full schema history
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

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid CORS request` | Frontend port doesn't match `CORS_ALLOWED_ORIGINS` in `.env` | Update `.env`, restart backend |
| `HTTP 500` on register | Backend down or database not ready | `docker ps`, check logs |
| Blank white page | JS error | F12 → Console |
| `401 Unauthorized` everywhere | Expired token | Log out and log back in |
| Flyway error on startup | Migration version conflict | `SELECT * FROM flyway_schema_history` — find the mismatch |
| Backend runs stale code | Dockerfile copies `target/*.jar` and the jar was not rebuilt | Before `docker compose up -d --build`, run `cd backend && mvn -q -DskipTests package` |

### Known limitations and technical TODOs

- Tests are still minimal — currently there is only a small application class sanity test, without a Spring context test or database
- Frontend is plain JavaScript — no TypeScript, no PropTypes
- No Swagger/OpenAPI — endpoints are only documented in the controller files
- `tailwindcss` is in `package.json` but was never actually used
- The backend uses stable Spring Boot `3.4.1`; keep future upgrades on stable releases instead of snapshots
- JWT is stored in frontend `localStorage`, which is convenient locally but needs XSS care in production

---

*Engineering thesis project · 2025*

## Security (MVP v0.5.4)
- JWT is currently stored in localStorage (	trpg_token) for MVP simplicity.
- Added hardening: CSP + frame deny + safe image/data URL validation + auth rate limiting + no token logging.
- Rate limiter uses server-observed client IP (emoteAddr) and ignores spoofed X-Forwarded-For in current MVP mode.
- HttpOnly cookie migration is intentionally postponed to a future phase to avoid breaking auth flow in this release.
- Manual smoke: register (min 8 password), invalid login (generic 401), protected endpoint 401/200 checks, ownership checks for characters/campaigns.

