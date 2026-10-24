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

Animacja przepływu danych jest w przygotowaniu.

## Zastrzeżenia

Osoby, numery i bank są fikcyjne. Projekt nie jest usługą administracji publicznej ani oficjalną aplikacją mObywatel. Strona nie używa godła, logo mObywatela, oryginalnych grafik dokumentów ani zdjęć osób. Grafiki w `telefon/assets` zostały przygotowane na potrzeby tego projektu.

Kod w folderze `telefon/` pochodzi z prototypu mobywatel.ai udostępnionego na licencji MIT. Szczegóły w pliku `LICENSE`.
