# Sprawdź, kto dzwoni

Klikalny prototyp na mObywatel Challenge. Pokazuje, jak mObywatel mógłby potwierdzać, że dzwoni naprawdę bank albo instytucja publiczna.

## Jak to działa

1. System banku zgłasza do mObywatela numer, pod który dzwoni, i opcjonalnie imię i nazwisko klienta.
2. Bank dostaje jednorazowy kod ważny przez dwie minuty. Konsultant podaje go na początku rozmowy.
3. Klient wpisuje kod w mObywatelu, także przed zalogowaniem.
4. mObywatel porównuje numer z kodu z numerem potwierdzonym w profilu klienta.
5. Gdy się zgadza, klient widzi, kto dzwoni. Bank nie dostaje żadnych danych klienta.

Kod wydany dla innego numeru kończy się ostrzeżeniem o oszustwie. Dzięki temu nie da się przekazać ofierze kodu od prawdziwego banku.

## Co jest w repozytorium

- `index.html`, `style.css`, `app.js`: strona pokazu, czyli system banku po lewej i telefon po prawej.
- `anim.js`: animacje rozmowy.
- `telefon/`: aplikacja mObywatel skopiowana z prototypu [mobywatel.ai](https://mobywatel.ai) i osadzona w ramce telefonu. Działa jak oryginał w trybie bez asystenta AI: dokumenty, układy, sprawy, scenariusze rozmów, znak mObywatela i strona wypożyczalni (`telefon/komputer.html`).
- `telefon/api-lokalne.js`: zastępuje serwer prototypu w przeglądarce, więc strona nie potrzebuje serwera.
- `telefon/weryfikacja.js` i `telefon/weryfikacja.css`: nasz dodatek, czyli ekran logowania, „Sprawdź, kto dzwoni” i oznaczenia funkcji wymagających modelu.
- `telefon/i18n/`: słowniki interfejsu z prototypu w postaci statycznych plików.

## Czego nie ma w tej wersji

- **Modelu AI.** Swobodna rozmowa, rozpoznawanie mowy i odczyt zdjęć wymagają modelu. Aplikacja oznacza je jako niewspierane i pokazuje przygotowane przykłady, tak jak prototyp bez asystenta.
- **Wymiany znaku między urządzeniami.** Bez serwera znak działa między kartami tej samej przeglądarki. Skaner pokazuje wtedy przycisk „Zeskanuj znak z drugiej karty”, bo kamera nie zobaczy ekranu tego samego komputera.

## Uruchomienie

To strona statyczna bez zależności. Można ją opublikować na GitHub Pages albo uruchomić lokalnie dowolnym serwerem plików, na przykład:

```bash
python3 -m http.server 8000
```

## Scenariusze

- **Jeden klient:** bank dzwoni do Marty. Telefon Marty można pokazać po zalogowaniu albo przed nim.
- **Dwóch klientów:** zalogowane telefony Marty i Kacpra obok siebie. Kod wydany dla numeru Marty i wpisany u Kacpra kończy się ostrzeżeniem o oszustwie.

Pięć przycisków animacji działa z każdej zakładki i na końcu włączają zakładkę „Jeden klient”:

- **Pozytywna animacja:** rozmowa konsultantki z Martą w dymkach, wpisanie danych w systemie banku, podanie kodu i potwierdzenie w telefonie.
- **Brak nazwiska:** bank zna tylko numer Marty, więc nie wpisuje imienia i nazwiska. Telefon potwierdza bank, ale prosi o upewnienie się, do kogo dzwoni.
- **Błędne nazwisko:** bank ma w kartotece inną osobę, na przykład poprzedniego właściciela numeru. Telefon pokazuje, że bank szuka kogoś innego.
- **Animacja oszustwa:** ta sama rozmowa, ale dzwoni oszust. Nie ma dostępu do systemu banku, więc wymyśla kod, a mObywatel ostrzega Martę.
- **Man in the middle:** oszust składa wniosek o konto na dane Marty i swój numer. Bank oddzwania na ten numer, a oszust w tym samym czasie dzwoni do Marty jako bank, ale w innej sprawie, bo Marta nie składała wniosku. Prosi bank o kod i przekazuje go Marcie. Kod jest prawdziwy, ale bank wydał go dla numeru oszusta, więc mObywatel ostrzega Martę, a bank dostaje sygnał o możliwym oszustwie.

## Zastrzeżenia

Osoby, numery i bank są fikcyjne. Projekt nie jest usługą administracji publicznej ani oficjalną aplikacją mObywatel. Strona nie używa godła, logo mObywatela, oryginalnych grafik dokumentów ani zdjęć osób. Grafiki w `telefon/assets` zostały przygotowane na potrzeby tego projektu.

Wszelkie prawa zastrzeżone. Bez pisemnej zgody autora nie wolno kopiować, rozpowszechniać ani wykorzystywać tego projektu w całości ani w części. Wyjątkiem jest kod w folderze `telefon/` pochodzący z prototypu mobywatel.ai, który pozostaje na licencji MIT. Szczegóły w pliku `LICENSE`.
