# Sprawdź, kto dzwoni

Klikalny prototyp na mObywatel Challenge. Pokazuje, jak mObywatel mógłby potwierdzać, że dzwoni naprawdę bank albo instytucja publiczna.

## Jak to działa

1. System banku zgłasza do mObywatela numer, pod który dzwoni, i opcjonalnie imię i nazwisko klienta.
2. Bank dostaje jednorazowy kod ważny przez dwie minuty. Konsultant podaje go w rozmowie.
3. Klient wpisuje kod w mObywatelu, także przed zalogowaniem.
4. mObywatel porównuje numer z kodu z numerem potwierdzonym w profilu klienta.
5. Gdy się zgadza, klient widzi, kto dzwoni. Bank nie dostaje żadnych danych klienta.

Kod wydany dla innego numeru kończy się ostrzeżeniem o oszustwie. Dzięki temu nie da się przekazać ofierze kodu od prawdziwego banku.

## Scenariusze

- Pozytywne sprawdzenie: gotowe.
- Kolejne scenariusze i animacja przepływu danych: w przygotowaniu.

## Uruchomienie

To strona statyczna bez serwera i bez zależności. Wystarczy otworzyć `index.html` w przeglądarce albo opublikować folder na GitHub Pages.

## Zastrzeżenia

Osoby, numery i bank są fikcyjne. Projekt nie jest usługą administracji publicznej ani oficjalną aplikacją mObywatel. Strona nie używa godła, logo mObywatela ani grafik dokumentów.

Kolory i ramka telefonu są wzorowane na prototypie z [mobywatel.ai](https://mobywatel.ai), udostępnionym na licencji MIT. Szczegóły w pliku `LICENSE`.
