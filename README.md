# TTRPG Assistant

> Aplikacja webowa wspierająca Mistrzów Gry i graczy podczas sesji TTRPG — zarządzanie kampaniami, generatory treści, postaci, kości, inicjatywa i więcej.

---

## Czym jest ten projekt?

TTRPG Assistant to pełnostackowa aplikacja inżynierska łącząca narzędzia przydatne przy stole RPG: system kampanii z zaproszeniami, generator NPC/łupu/lokacji, kreator postaci, rzucanie kośćmi, tracker inicjatywy oraz słowniczek pojęć. Dane są powiązane z kontem użytkownika — każdy widzi tylko własne wyniki i kampanie.

**Stack:** React 19 + Spring Boot 3 + PostgreSQL 16  
**Auth:** JWT (bezstanowy, filter-based)  
**Środowisko lokalne:** Docker Compose (db + backend)

---

## Szybki start

### Wymagania

| Narzędzie | Wersja | Uwagi |
|-----------|--------|-------|
| Node.js   | 20+    | `nvm install 20` |
| Java      | 17+    | JDK, nie JRE |
| Docker    | 24+    | + Docker Compose v2 |
| Maven     | 3.9+   | lub użyj `./mvnw` |

### Setup (ok. 5 minut)

```bash
# 1. Sklonuj repo
git clone <repo-url>
cd ttrpg-assistant

# 2. Skopiuj zmienne środowiskowe
cp .env.example .env
# Uzupełnij .env (szczegóły w sekcji Konfiguracja)

# 3. Uruchom bazę danych i backend w Dockerze
cd infra
docker compose up -d

# 4. Uruchom frontend (dev server)
cd ../frontend
npm install
npm run dev
```

### Weryfikacja

- [ ] Frontend dostępny na `http://localhost:5173`
- [ ] Backend health check: `curl http://localhost:8080/api/health` → `OK`
- [ ] Rejestracja nowego konta na `/register` działa
- [ ] Dashboard ładuje się po zalogowaniu

---

## Architektura

```
Przeglądarka
     │
     │  HTTP (Vite proxy /api → :8080)
     ▼
┌─────────────┐       ┌──────────────────────┐
│  React SPA  │──────▶│  Spring Boot REST API │
│  Vite :5173 │       │  Tomcat :8080         │
└─────────────┘       └──────────┬───────────┘
                                 │ JDBC / JPA
                                 ▼
                       ┌─────────────────────┐
                       │   PostgreSQL 16      │
                       │   port 5432          │
                       │   Flyway migrations  │
                       └─────────────────────┘
```

### Stack technologiczny

| Warstwa    | Technologia                        | Dlaczego |
|------------|------------------------------------|----------|
| Frontend   | React 19, Vite 7, React Router 7   | SPA, HMR, lazy loading |
| Styling    | Custom CSS + CSS variables         | Pełna kontrola, dark/light theme |
| API Client | Moduły JS (`src/api/`)             | Thin wrappers nad fetch |
| Backend    | Spring Boot 3.5, Java 17           | Sprawdzony enterprise stack |
| ORM        | Spring Data JPA + Hibernate        | Typowane zapytania |
| Migracje   | Flyway                             | Wersjonowanie schematu |
| Auth       | Spring Security + JWT (JJWT 0.12)  | Bezstanowe, scalable |
| Walidacja  | Jakarta Validation                 | Deklaratywna, na DTO |
| Boilerplate| Lombok                             | Eliminuje gettery/settery |
| Baza danych| PostgreSQL 16                      | JSONB, indeksy, FK |
| Infra      | Docker + Docker Compose            | Reprodukowalność środowiska |

---

## Struktura projektu

```
ttrpg-assistant/
├── backend/                    # Spring Boot app
│   └── src/main/java/pl/ttrpgassistant/backend/
│       ├── auth/               # Rejestracja, logowanie, DTOs
│       ├── campaign/           # Kampanie, sesje, materiały, wiadomości
│       ├── character/          # Postaci gracza (JSONB schema)
│       ├── common/error/       # GlobalExceptionHandler
│       ├── config/             # CORS
│       ├── generator/          # Generatory losowych treści
│       ├── glossary/           # Słownik pojęć TTRPG
│       ├── monster/            # Baza potworów
│       ├── rules/              # Zasady gry
│       ├── security/           # JwtFilter, SecurityConfig
│       ├── social/             # Znajomi, blokowanie, profile
│       └── user/               # Ustawienia konta
│
├── frontend/
│   └── src/
│       ├── api/                # HTTP klient (http.js + moduły per feature)
│       ├── auth/               # AuthContext, ProtectedRoute
│       ├── components/         # AppShell, TopNav, QuickCharacterCreator
│       ├── pages/              # 14 stron (lazy loaded)
│       └── styles/             # CSS per strona + theme.css / globals.css
│
├── infra/
│   └── docker-compose.yml      # PostgreSQL 16 + backend
│
├── .env.example                # Szablon zmiennych środowiskowych
└── .env                        # Lokalne wartości (nie commitować!)
```

### Kluczowe pliki

| Plik | Rola |
|------|------|
| `backend/src/.../security/JwtAuthFilter.java` | Weryfikacja JWT na każdym requeście |
| `backend/src/.../common/error/GlobalExceptionHandler.java` | Centralna obsługa błędów → HTTP response |
| `backend/src/main/resources/db/migration/` | 15 migracji Flyway (V1–V15) |
| `frontend/src/auth/AuthContext.jsx` | Stan autoryzacji, token, logout |
| `frontend/src/App.jsx` | Routing + lazy loading stron |
| `frontend/src/styles/theme.css` | Wszystkie CSS variables (dark/light) |
| `infra/docker-compose.yml` | Definicja kontenerów db + backend |
| `.env` | Sekrety i konfiguracja środowiska |

---

## Konfiguracja środowiska (`.env`)

```bash
# Baza danych
POSTGRES_DB=ttrpg
POSTGRES_USER=ttrpg
POSTGRES_PASSWORD=ttrpg_pass

# JWT — minimum 32 znaki!
JWT_SECRET=zmien_to_na_losowy_string_minimum_32_znaki
JWT_EXP_MIN=10080          # 7 dni

# CORS — musi pasować do portu frontendu
CORS_ALLOWED_ORIGINS=http://localhost:5173

# AI (opcjonalnie)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
DEEPAI_API_KEY=
```

> ⚠️ Nigdy nie commituj `.env` do repozytorium.

---

## Typowe zadania developerskie

### Dodaj nowy endpoint

```
1. [moduł]/[Nazwa]Controller.java   — @RestController, @RequestMapping
2. [moduł]/[Nazwa]Service.java      — logika biznesowa
3. [moduł]/[Nazwa]Repository.java   — extends JpaRepository
4. [moduł]/dto/                     — request/response DTOs z @Valid
```

### Dodaj nową stronę (frontend)

```
1. frontend/src/pages/NowaStrona.jsx
2. frontend/src/styles/nowa-strona.css
3. Dodaj lazy import w App.jsx
4. Dodaj <Route> w App.jsx
5. Dodaj link w TopNav.jsx jeśli potrzeba
```

### Dodaj migrację bazy danych

```bash
# Utwórz plik: backend/src/main/resources/db/migration/V{n+1}__opis.sql
# Flyway wykona ją automatycznie przy starcie backendu
```

### Przebuduj i zrestartuj backend

```bash
cd infra
docker compose up -d --build backend
docker logs ttrpg_backend -f
```

---

## Endpointy API — przegląd

| Endpoint | Moduł |
|----------|-------|
| `POST /api/auth/register` | Rejestracja |
| `POST /api/auth/login` | Logowanie → JWT |
| `GET  /api/me` | Dane zalogowanego użytkownika |
| `PATCH /api/settings/*` | Zmiana e-mail, hasła, displayName |
| `GET/POST /api/campaigns` | Lista i tworzenie kampanii |
| `GET/POST /api/campaigns/{id}/sessions` | Sesje kampanii |
| `GET/POST /api/characters` | Postaci gracza |
| `GET /api/generators/{type}/{system}` | Losowe treści |
| `GET /api/social/overview` | Znajomi, zaproszenia |
| `GET /api/monsters` | Publiczna lista potworów (no auth) |
| `GET /api/health` | Health check |

Pełna lista (~50 endpointów) w plikach `*Controller.java` per moduł.

---

## Debugowanie

### Typowe błędy

| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| `Invalid CORS request` | Port frontendu ≠ `CORS_ALLOWED_ORIGINS` | Zaktualizuj `.env`, zrestartuj backend |
| `HTTP 500` na rejestracji | Backend nie działa | `docker ps`, `docker logs ttrpg_backend` |
| Biała pusta strona | Błąd JS | F12 → Console |
| `401 Unauthorized` | Wygasły token | Wyloguj i zaloguj ponownie |
| Flyway error przy starcie | Konflikt wersji migracji | Sprawdź `flyway_schema_history` |

### Logi i diagnostyka

```bash
# Logi backendu
docker logs ttrpg_backend -f --tail 50

# Podłączenie do bazy
docker exec -it ttrpg_db psql -U ttrpg -d ttrpg

# Przydatne zapytania
SELECT id, email, role, created_at FROM users;
SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;
```

---

## Struktura bazy danych

```
users                       konta, role, ustawienia profilu
campaigns                   kampanie (owner, join_code, status)
campaign_members            role w kampanii (gm / player)
campaign_sessions           sesje (scheduled_at → started_at → finished_at)
campaign_session_messages   wiadomości sesji
campaign_session_notes      notatki GM/graczy
campaign_materials          materiały do sesji (URL, opis)
campaign_notifications      powiadomienia kampanijne
player_characters           postaci + character_data_json (JSONB)
friendships                 relacje znajomości (composite PK)
friend_requests             zaproszenia (pending / accepted / rejected)
user_blocks                 blokady użytkowników
monsters                    baza potworów (seed V2, V3)
glossary_terms              słownik pojęć TTRPG
rules_pages                 zasady gry
generator_pools             pule danych generatorów (seed V9)
```

---

## Wdrożenie produkcyjne — checklist

- [ ] `JWT_SECRET` — losowy ciąg 64+ znaków
- [ ] `CORS_ALLOWED_ORIGINS` — domena produkcyjna
- [ ] Zmień hasła bazy danych
- [ ] HTTPS przez reverse proxy (nginx / Caddy)
- [ ] Port 5432 niepubliczny
- [ ] `npm run build` → serwuj `dist/` statycznie
- [ ] Ogranicz `JWT_EXP_MIN` odpowiednio

---

## Znane ograniczenia

- Brak testów (tylko boilerplate `BackendApplicationTests.java`)
- Frontend w JavaScript — brak TypeScript i PropTypes
- Brak Swagger/OpenAPI
- Brak rate limitingu na endpointach `/auth/*`
- `tailwindcss` w `package.json` — nieużywany

