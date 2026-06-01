# Tabele testow do pracy inzynierskiej

## Tabela 5.1. Zakres testowania aplikacji TTRPG Assistant

| Obszar testowania | Zakres weryfikacji | Rodzaj testow | Cel testowania |
|---|---|---|---|
| Uwierzytelnianie i bezpieczenstwo | Rejestracja, logowanie, walidacja hasla, ochrona endpointow, reset hasla, uniewaznianie tokenow JWT | Automatyczne backend, testy manualne | Potwierdzenie, ze dostep do zasobow prywatnych wymaga poprawnego uwierzytelnienia i uprawnien |
| Kampanie i sesje | Tworzenie kampanii, lista i szczegoly kampanii, dolaczanie kodem, edycja, usuwanie, tworzenie i start/koniec sesji | Automatyczne backend, automatyczne frontend, testy manualne | Sprawdzenie glownego przeplywu pracy mistrza gry i gracza |
| Postacie graczy | Szybkie tworzenie postaci DnD i CoC, import/eksport, edycja arkusza, przypisywanie postaci do kampanii | Automatyczne backend, automatyczne frontend, testy manualne | Weryfikacja poprawnego przechowywania kart postaci i kontroli dostepu |
| Przypisywanie postaci do kampanii | Przypisanie wlasnej postaci, blokada cudzej postaci, blokada niezgodnego systemu RPG | Automatyczne backend | Zapewnienie spojnosci danych kampanii i postaci |
| Rzuty koscmi i requested rolls | Parser notacji rzutow, historia rzutow, wymagane rzuty zlecane przez MG, realizacja i anulowanie rzutow | Automatyczne backend, automatyczne frontend, testy manualne | Sprawdzenie poprawnosci mechaniki rzutow i przeplywu MG -> gracz |
| Inicjatywa i walka | Encountery, uczestnicy walki, kolejka tur, zmiany HP, warunki i statusy | Automatyczne backend, automatyczne frontend, testy manualne | Weryfikacja stabilnosci modulu prowadzenia walki |
| Generatory tresci | Katalog generatorow, formularze, generowanie wynikow, zapis historii, oczyszczanie tekstu | Automatyczne backend, automatyczne frontend, testy manualne | Potwierdzenie poprawnosci modulu pomocniczego do generowania tresci RPG |
| Komunikacja frontend-backend | Helpery API, naglowek Authorization Bearer, obsluga bledow HTTP, poprawne adresy endpointow | Automatyczne frontend | Sprawdzenie, czy frontend komunikuje sie z REST API zgodnie z kontraktem |
| Interfejs uzytkownika | Dashboard, widoki kampanii, postaci, generatorow, powiadomien, wiadomosci i uploadu | Automatyczne frontend, testy manualne | Weryfikacja renderowania danych, stanow pustych, bledow i akcji uzytkownika |
| Upload obrazow | Walidacja typu pliku, wymaganie autoryzacji, podglad pliku i obsluga bledu uploadu | Automatyczne backend, automatyczne frontend, testy manualne | Zapewnienie bezpiecznej i przewidywalnej obslugi plikow graficznych |

## Tabela 5.2. Przykladowe scenariusze testow manualnych aplikacji TTRPG Assistant

| ID | Scenariusz | Kroki testowe | Oczekiwany rezultat | Wynik |
|---|---|---|---|---|
| M-01 | Rejestracja i logowanie uzytkownika | Otworzyc formularz rejestracji, utworzyc konto, wylogowac sie, zalogowac tym samym kontem | Konto zostaje utworzone, uzytkownik otrzymuje dostep do aplikacji po logowaniu | test manualny |
| M-02 | Utworzenie kampanii przez MG | Zalogowac sie, przejsc do kampanii, wypelnic formularz tworzenia kampanii i zapisac | Nowa kampania pojawia sie na liscie kampanii uzytkownika | test manualny |
| M-03 | Dolaczenie gracza do kampanii kodem | Na koncie gracza wpisac poprawny kod zaproszenia kampanii | Gracz zostaje dodany do kampanii i widzi jej szczegoly | test manualny |
| M-04 | Utworzenie i rozpoczecie sesji kampanii | Jako wlasciciel kampanii utworzyc sesje, a nastepnie uruchomic ja jako sesje aktywna | Sesja zmienia status na aktywny i mozna przejsc do widoku live session | test manualny |
| M-05 | Tworzenie postaci DnD lub CoC | Przejsc do widoku postaci, wybrac system, wypelnic wymagane dane i zapisac postac | Postac zostaje zapisana i jest widoczna na liscie postaci | test manualny |
| M-06 | Przypisanie postaci do kampanii | W szczegolach kampanii wybrac postac zgodna z systemem kampanii i przypisac ja do kampanii | Postac pojawia sie w sekcji postaci kampanii | test manualny |
| M-07 | Wymagany rzut zadany przez MG | W aktywnej sesji MG tworzy requested roll dla gracza, a gracz wykonuje rzut | Rzut zmienia status na wykonany i pojawia sie w historii rzutow sesji | test manualny |
| M-08 | Uzycie generatora tresci | Przejsc do generatorow, wybrac generator, wypelnic formularz i uruchomic generowanie | Aplikacja pokazuje wynik generatora oraz zapisuje go w historii lokalnej lub systemowej, jezeli funkcja istnieje | test manualny |
| M-09 | Upload obrazu | W miejscu obslugujacym upload wybrac poprawny plik PNG/JPEG/WebP i zapisac | Plik zostaje zaakceptowany, a aplikacja pokazuje podglad albo adres obrazu | test manualny |
| M-10 | Oznaczanie powiadomien jako przeczytane | Otworzyc dzwonek powiadomien i wybrac akcje oznaczania wszystkich jako przeczytane | Powiadomienia zmieniaja stan na przeczytany, a znacznik nieprzeczytanych znika | test manualny |

## Tabela 5.3. Przykladowe testy czesci serwerowej aplikacji TTRPG Assistant

| ID | Klasa lub plik testowy | Testowany element | Sprawdzany przypadek | Oczekiwany rezultat | Wynik |
|---|---|---|---|---|---|
| B-01 | `backend/src/test/java/pl/ttrpgassistant/backend/auth/AuthSecurityIT.java` | Uwierzytelnianie i bezpieczenstwo | Walidacja hasla, logowanie, ochrona endpointow, reset hasla, odrzucanie starego JWT | Niepoprawne dane sa odrzucane, poprawny token daje dostep, stare tokeny sa uniewazniane | do potwierdzenia w srodowisku testow integracyjnych |
| B-02 | `backend/src/test/java/pl/ttrpgassistant/backend/campaign/CampaignRegressionIT.java` | Kampanie i sesje | Tworzenie, listowanie, szczegoly, edycja, dolaczanie kodem, start i zakonczenie sesji | Wlasciciel moze zarzadzac kampania, a nieuprawnione operacje sa blokowane | do potwierdzenia w srodowisku testow integracyjnych |
| B-03 | `backend/src/test/java/pl/ttrpgassistant/backend/campaign/CampaignCharacterAssignmentIT.java` | Przypisywanie postaci do kampanii | Przypisanie wlasnej postaci, blokada cudzej postaci, blokada niezgodnego systemu | Relacja kampania-postac jest tworzona tylko dla poprawnych i dozwolonych danych | do potwierdzenia w srodowisku testow integracyjnych |
| B-04 | `backend/src/test/java/pl/ttrpgassistant/backend/character/PlayerCharacterQuickCreateIT.java` oraz `backend/src/test/java/pl/ttrpgassistant/backend/character/PlayerCharacterCocQuickCreateIT.java` | Postacie graczy | Szybkie tworzenie postaci DnD i CoC oraz walidacja danych postaci | Postac zostaje zapisana z arkuszem danych, a niepoprawne dane sa odrzucane | do potwierdzenia w srodowisku testow integracyjnych |
| B-05 | `backend/src/test/java/pl/ttrpgassistant/backend/campaign/RequestedRollIT.java` | Requested rolls | Cykl zycia wymaganego rzutu oraz uprawnienia MG i gracza | Rzut moze zostac utworzony, wykonany albo anulowany zgodnie z uprawnieniami | do potwierdzenia w srodowisku testow integracyjnych |
| B-06 | `backend/src/test/java/pl/ttrpgassistant/backend/campaign/DiceExpressionParserTest.java` | Parser rzutow koscmi | Parsowanie poprawnych wyrazen i odrzucanie blednej notacji | Poprawne wyrazenia sa obliczane, a niepoprawne zglaszaja blad walidacji | pozytywny |
| B-07 | `backend/src/test/java/pl/ttrpgassistant/backend/campaign/DiceRollHistoryIT.java` | Historia rzutow | Tworzenie, listowanie, ochrona i usuwanie wpisow historii rzutow | Historia rzutow jest dostepna tylko dla uprawnionych czlonkow kampanii | do potwierdzenia w srodowisku testow integracyjnych |
| B-08 | `backend/src/test/java/pl/ttrpgassistant/backend/campaign/CombatEncounterIT.java` | Inicjatywa i walka | Tworzenie encountera, dostep do danych i reguly zmiany tur | System dopuszcza tylko poprawne operacje na encounterze i kolejce tur | do potwierdzenia w srodowisku testow integracyjnych |
| B-09 | `backend/src/test/java/pl/ttrpgassistant/backend/generator/GeneratorExpansionIT.java` oraz `backend/src/test/java/pl/ttrpgassistant/backend/generator/GeneratorTextSanitizerTest.java` | Generatory tresci | Obsluga pol formularzy, struktury wynikow oraz oczyszczanie tekstu z artefaktow kodowania | Wyniki generatorow maja poprawna strukture, a tekst jest sanitizowany | czesciowo pozytywny; test jednostkowy sanitizacji przeszedl |
| B-10 | `backend/src/test/java/pl/ttrpgassistant/backend/upload/UploadControllerIT.java` | Upload obrazow | Akceptacja PNG/JPEG/WebP, odrzucenie zlego typu, wymaganie autoryzacji | Poprawny obraz jest przyjmowany, a niepoprawny plik lub brak JWT sa odrzucane | do potwierdzenia w srodowisku testow integracyjnych |

## Tabela 5.4. Przykladowe testy czesci klienckiej aplikacji TTRPG Assistant

| ID | Klasa lub plik testowy | Testowany widok lub komponent | Sprawdzany przypadek | Oczekiwany rezultat | Wynik |
|---|---|---|---|---|---|
| F-01 | `frontend/src/__tests__/auth/AuthContext.test.jsx` | Kontekst uwierzytelniania | Inicjalizacja tokena, reakcja na zdarzenie unauthorized, wylogowanie | Stan uwierzytelnienia i localStorage sa aktualizowane poprawnie | pozytywny |
| F-02 | `frontend/src/__tests__/api/campaigns.test.js` | Helpery API kampanii | Wysylanie zapytan do endpointow kampanii, live state, dice rolls, requested rolls i obsluga bledow | Zapytania maja poprawne URL, metody, body oraz naglowek Authorization Bearer | pozytywny |
| F-03 | `frontend/src/__tests__/pages/DashboardPage.test.jsx` | Dashboard | Aktywna sesja, najblizsza planowana sesja, sekcje operacyjne, role i dostepnosc | Dashboard renderuje dane operacyjne i poprawne stany puste | pozytywny w wybranym uruchomieniu testow |
| F-04 | `frontend/src/__tests__/pages/campaign/CampaignDetailPage.test.jsx` | Szczegoly kampanii | Roznice widoku MG i gracza, tworzenie sesji, linki do postaci i brak placeholderow | Widok pokazuje akcje zgodne z rola uzytkownika | pozytywny |
| F-05 | `frontend/src/__tests__/pages/CharactersPage.test.jsx` | Strona postaci | Akcje sidebara, import/eksport, tworzenie DnD i CoC, zapis i usuwanie | Uzytkownik moze zarzadzac postaciami z poziomu UI | wymaga aktualizacji po zmianach UI |
| F-06 | `frontend/src/__tests__/pages/GeneratorsPage.test.jsx` | Strona generatorow | Renderowanie generatorow z katalogu backendu, formularz encountera, wynik i historia lokalna | Generator pokazuje formularz, wynik i zapis historii bez sztucznych danych | pozytywny |
| F-07 | `frontend/src/__tests__/components/NotificationBell.test.jsx` | Dzwonek powiadomien | Oznaczenie powiadomienia jako przeczytane, usuwanie, oznaczanie wszystkich i czyszczenie | Komponent wywoluje odpowiednie akcje API i aktualizuje stan powiadomien | pozytywny |
| F-08 | `frontend/src/__tests__/components/ImageUpload.test.jsx` | Komponent uploadu obrazu | Podglad obrazu, wywolanie uploadImage, obsluga bledu uploadu | Komponent przekazuje URL do formularza albo pokazuje komunikat bledu | pozytywny |

## Uwagi do rozdzialu 5

Tabele 5.1 i 5.2 mozna wykorzystac bezposrednio jako opis zakresu testowania oraz scenariuszy manualnych. Tabela 5.3 zawiera realne klasy testowe backendu z repozytorium, jednak testy integracyjne wymagaja uruchomienia w poprawnie skonfigurowanym srodowisku z baza PostgreSQL i poprawnym adresem JDBC. W lokalnym uruchomieniu komenda `mvn test` potwierdzila przejscie testow jednostkowych i kontekstowych, natomiast wybrane testy integracyjne wymagaja poprawnej zmiennej `DB_URL`.

Tabela 5.4 opiera sie na realnych testach Vitest i React Testing Library. Wybrany reprezentatywny zestaw testow frontendu przeszedl pozytywnie, ale pelne uruchomienie testow frontendu wykazalo kilka regresji po ostatnich zmianach wizualnych. Przed finalnym oddaniem pracy warto ponownie uruchomic pelny zestaw testow i zaktualizowac wiersze oznaczone jako wymagajace aktualizacji.

W repozytorium nie odnaleziono osobnego testu automatycznego dedykowanego bezposrednio endpointowi health check, dlatego nie zostal on wpisany jako oddzielny automatyczny test backendu.
