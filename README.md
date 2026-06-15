# TTRPG Assistant

> Polski | English

## Polski

### O projekcie

TTRPG Assistant to aplikacja webowa dla graczy i Mistrzów Gry prowadzących sesje tabletop RPG. Projekt pomaga organizować kampanie, sesje, postacie, rzuty kośćmi, inicjatywę, notatki, wiadomości, znajomych oraz materiały pomocnicze do rozgrywki.

Aplikacja została przygotowana jako pełny system klient-serwer: część kliencka działa w przeglądarce, część serwerowa udostępnia REST API, a dane są przechowywane w relacyjnej bazie PostgreSQL.

### Główne funkcje

- Rejestracja, logowanie, wylogowanie i reset hasła.
- Profil użytkownika, ustawienia konta, grafiki profilu i kolor nicku na czacie.
- Tworzenie kampanii, zapraszanie graczy kodem, publiczne i prywatne kampanie.
- Zarządzanie członkami kampanii, sesjami, obecnością, materiałami i notatkami.
- Widoki dla właściciela kampanii/MG oraz dla gracza.
- Tworzenie i edycja postaci dla D&D 5e oraz Call of Cthulhu 7e.
- Import i eksport postaci w formacie JSON.
- Przypisywanie postaci do kampanii.
- Rzuty kośćmi z historią wyników.
- Inicjatywa i spotkania bojowe z uczestnikami, HP, stanami i turami.
- Generatory treści RPG, między innymi NPC, lokacje, łup, haczyki fabularne i spotkania.
- Kompendium, słownik pojęć i podstawowe zasady systemów RPG.
- Znajomi, zaproszenia, blokowanie użytkowników i publiczne profile.
- Wiadomości prywatne oraz załączniki.
- Upload obrazów używany w profilach, kampaniach i postaciach.
- Powiadomienia użytkownika i powiadomienia kampanii.
- Notatki użytkownika powiązane opcjonalnie z kampanią albo postacią.

### Technologie

| Warstwa | Technologie |
|---|---|
| Część kliencka | React 19, Vite 7, React Router, JavaScript, CSS |
| Testy części klienckiej | Vitest, React Testing Library, jsdom |
| Część serwerowa | Java 17, Spring Boot 3.4, Spring Web, Spring Security, Spring Validation |
| Baza danych | PostgreSQL, Spring Data JPA, Hibernate, Flyway |
| Uwierzytelnianie | JWT, JJWT, BCrypt |
| Dokumentacja API | springdoc-openapi / Swagger UI |
| Infrastruktura lokalna | Docker Compose |

### Architektura

```text
Przeglądarka
  |
  | HTTP / REST API
  v
Część serwerowa Spring Boot
  |
  | Spring Data JPA / Hibernate
  v
PostgreSQL
  |
  v
Migracje Flyway
```

Część kliencka komunikuje się z częścią serwerową przez punkty REST API. Po zalogowaniu użytkownik otrzymuje token JWT, który jest przesyłany w nagłówku `Authorization: Bearer <token>`. Spring Security chroni prywatne zasoby, a logika dostępu do kampanii, postaci, rozmów i notatek jest sprawdzana w serwisach domenowych.

### Struktura projektu

```text
ttrpg-assistant/
├── backend/
│   ├── src/main/java/pl/ttrpgassistant/backend/
│   │   ├── auth/           # rejestracja, logowanie, reset hasła, JWT
│   │   ├── campaign/       # kampanie, sesje, notatki, materiały, rzuty, inicjatywa
│   │   ├── character/      # postacie graczy, import i eksport JSON
│   │   ├── compendium/     # kompendium i dane pomocnicze systemów RPG
│   │   ├── generator/      # generatory treści RPG
│   │   ├── glossary/       # słownik pojęć
│   │   ├── messages/       # wiadomości prywatne i załączniki
│   │   ├── notes/          # notatki użytkownika
│   │   ├── notifications/  # powiadomienia
│   │   ├── security/       # konfiguracja Spring Security i JWT
│   │   ├── social/         # znajomi, profile publiczne, blokady
│   │   ├── upload/         # upload obrazów
│   │   └── user/           # profil i ustawienia konta
│   └── src/main/resources/db/migration/
│       └── V*.sql          # migracje Flyway
├── frontend/
│   └── src/
│       ├── api/            # klient HTTP i funkcje komunikacji z API
│       ├── auth/           # kontekst autoryzacji i trasy chronione
│       ├── components/     # komponenty współdzielone
│       ├── pages/          # widoki aplikacji
│       └── styles/         # style CSS
└── infra/
    └── docker-compose.yml  # lokalna baza danych i usługi
```

### Uruchomienie lokalne

Wymagania:

- Node.js 20+
- Java JDK 17+
- Maven
- Docker i Docker Compose

Kroki:

```bash
git clone <repo-url>
cd ttrpg-assistant

cp .env.example .env

cd backend
mvn -q -DskipTests package

cd ../infra
docker compose up -d --build

cd ../frontend
npm install
npm run dev
```

Domyślne adresy:

- Część kliencka: `http://localhost:5173`
- Część serwerowa: `http://localhost:8080`
- Health check: `http://localhost:8080/api/health`

### Testy i weryfikacja

```bash
# część kliencka
cd frontend
npm run lint
npm run build
npm run test

# część serwerowa
cd ../backend
mvn test
```

### Bezpieczeństwo

- Hasła są przechowywane jako hash BCrypt.
- Uwierzytelnianie opiera się na tokenach JWT.
- Większość punktów końcowych wymaga zalogowania.
- Publiczne są między innymi: rejestracja, logowanie, reset hasła, health check, kompendium, słownik i generatory.
- Dane kampanii, postaci, rozmów i notatek są ograniczane do właścicieli albo uprawnionych członków.
- Część serwerowa zawiera globalną obsługę błędów i walidację danych wejściowych.

---

## English

### About the project

TTRPG Assistant is a web application for tabletop RPG players and Game Masters. It helps organize campaigns, sessions, characters, dice rolls, initiative, notes, messages, friends, and game materials in one place.

The application is built as a full client-server system: the client side runs in the browser, the server side exposes a REST API, and data is stored in a PostgreSQL relational database.

### Main features

- User registration, login, logout, and password reset.
- User profile, account settings, profile images, and chat nickname color.
- Campaign creation, invite codes, public and private campaigns.
- Campaign members, sessions, attendance, materials, and notes.
- Separate views for campaign owner/Game Master and players.
- Character creation and editing for D&D 5e and Call of Cthulhu 7e.
- Character JSON import and export.
- Assigning characters to campaigns.
- Dice rolls with roll history.
- Initiative and combat encounters with participants, HP, conditions, and turns.
- RPG content generators, including NPCs, locations, loot, story hooks, and encounters.
- Compendium, glossary, and basic RPG rules.
- Friends, invitations, user blocking, and public profiles.
- Private messages and attachments.
- Image upload for profiles, campaigns, and characters.
- User notifications and campaign notifications.
- User notes optionally linked to campaigns or characters.

### Technologies

| Layer | Technologies |
|---|---|
| Client side | React 19, Vite 7, React Router, JavaScript, CSS |
| Client-side tests | Vitest, React Testing Library, jsdom |
| Server side | Java 17, Spring Boot 3.4, Spring Web, Spring Security, Spring Validation |
| Database | PostgreSQL, Spring Data JPA, Hibernate, Flyway |
| Authentication | JWT, JJWT, BCrypt |
| API documentation | springdoc-openapi / Swagger UI |
| Local infrastructure | Docker Compose |

### Architecture

```text
Browser
  |
  | HTTP / REST API
  v
Spring Boot server side
  |
  | Spring Data JPA / Hibernate
  v
PostgreSQL
  |
  v
Flyway migrations
```

The client side communicates with the server side through REST API endpoints. After login, the user receives a JWT token, which is sent in the `Authorization: Bearer <token>` header. Spring Security protects private resources, while domain services enforce access rules for campaigns, characters, conversations, and notes.

### Project structure

```text
ttrpg-assistant/
├── backend/
│   ├── src/main/java/pl/ttrpgassistant/backend/
│   │   ├── auth/           # registration, login, password reset, JWT
│   │   ├── campaign/       # campaigns, sessions, notes, materials, rolls, initiative
│   │   ├── character/      # player characters, JSON import and export
│   │   ├── compendium/     # compendium and RPG system helper data
│   │   ├── generator/      # RPG content generators
│   │   ├── glossary/       # glossary terms
│   │   ├── messages/       # private messages and attachments
│   │   ├── notes/          # user notes
│   │   ├── notifications/  # notifications
│   │   ├── security/       # Spring Security and JWT configuration
│   │   ├── social/         # friends, public profiles, blocks
│   │   ├── upload/         # image upload
│   │   └── user/           # profile and account settings
│   └── src/main/resources/db/migration/
│       └── V*.sql          # Flyway migrations
├── frontend/
│   └── src/
│       ├── api/            # HTTP client and API communication helpers
│       ├── auth/           # auth context and protected routes
│       ├── components/     # shared components
│       ├── pages/          # application views
│       └── styles/         # CSS styles
└── infra/
    └── docker-compose.yml  # local database and services
```

### Running locally

Requirements:

- Node.js 20+
- Java JDK 17+
- Maven
- Docker and Docker Compose

Steps:

```bash
git clone <repo-url>
cd ttrpg-assistant

cp .env.example .env

cd backend
mvn -q -DskipTests package

cd ../infra
docker compose up -d --build

cd ../frontend
npm install
npm run dev
```

Default URLs:

- Client side: `http://localhost:5173`
- Server side: `http://localhost:8080`
- Health check: `http://localhost:8080/api/health`

### Tests and verification

```bash
# client side
cd frontend
npm run lint
npm run build
npm run test

# server side
cd ../backend
mvn test
```

### Security

- Passwords are stored as BCrypt hashes.
- Authentication is based on JWT tokens.
- Most endpoints require authentication.
- Public endpoints include registration, login, password reset, health check, compendium, glossary, and generators.
- Campaign, character, conversation, and note data is restricted to owners or authorized members.
- The server side includes global error handling and input validation.
