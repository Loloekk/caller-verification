# Sprawdź, kto dzwoni (Check who's calling)

A clickable prototype for the mObywatel Challenge. It shows how the mObywatel app could confirm that a call really comes from a bank or a public institution.

## The problem

Scammers increasingly pretend to be banks and public institutions. They spoof the number on the caller ID and sound convincing. Some banking apps already confirm the bank's own calls with a push notification, but that does not help when the customer does not use the app, or when another bank or an office is calling. Sending such a notification through mObywatel would require the institution to know exactly who the recipient is.

## How it works

The verification goes the other way round:

1. The bank's system reports to mObywatel the number it is calling and, if it knows the customer, their first and last name.
2. The bank gets a one-time code valid for two minutes. The consultant reads it out at the start of the call.
3. The customer enters the code in mObywatel, also before logging in.
4. mObywatel compares the number from the code with the number confirmed in the customer's profile, and the name if the bank provided one.
5. If they match, the customer sees who is calling. The bank receives no customer data.

A code issued for a different number ends with a fraud warning, and the bank is notified. This means a scammer cannot pass a code from a real bank on to a victim.

## Repository contents

- `index.html`, `style.css`, `app.js`: the demo page, with the bank's system on the left and the phone on the right. An intro window explaining the idea opens on load.
- `anim.js`: the conversation animations.
- `telefon/`: the mObywatel app copied from the [mobywatel.ai](https://mobywatel.ai) prototype and embedded in the phone frame. It works like the original without the AI assistant; features that need a model are marked as unsupported.
- `telefon/api-lokalne.js`: replaces the prototype's server in the browser, so the page needs no backend.
- `telefon/weryfikacja.js` and `telefon/weryfikacja.css`: our addition, the "Sprawdź, kto dzwoni" screen and its results.
- `telefon/i18n/`: the prototype's interface dictionaries as static files.

## Running

It is a static page with no dependencies. Serve the folder with any static file server, for example:

```bash
python3 -m http.server 8000
```

## Scenarios

- **Jeden klient (one customer):** the bank calls Marta. Marta's phone can be shown logged in or before login.
- **Dwóch klientów (two customers):** Marta's and Kacper's logged-in phones side by side. A code issued for Marta's number and entered on Kacper's phone ends with a fraud warning.

Five animation buttons work from either tab and switch back to "Jeden klient" when they finish:

- **Pozytywna animacja (positive):** the consultant and Marta talk in speech bubbles, the consultant enters the data in the bank's system, reads out the code, and Marta's phone confirms the call.
- **Brak nazwiska (no name):** the bank only knows Marta's number, so it leaves the name empty. The phone confirms the bank but asks Marta to make sure who the bank wants to reach.
- **Błędne nazwisko (wrong name):** the bank has a different person on file, for example the previous owner of the number. The phone shows that the bank is looking for someone else.
- **Animacja oszustwa (fraud):** the same conversation, but a scammer is calling. Without access to the bank's system, the scammer makes up a code and mObywatel warns Marta.
- **Man in the middle:** the scammer applies for an account with Marta's details and the scammer's own number. When the bank calls that number back, the scammer calls Marta at the same time, posing as the bank with a different story, since Marta never applied for anything. The scammer asks the bank for a code and passes it on to Marta. The code is real, but it was issued for the scammer's number, so mObywatel warns Marta and the bank gets a fraud alert.

## Disclaimer

All people, numbers and the bank are fictional. This project is not a public administration service or the official mObywatel app. The page does not use the national emblem, the mObywatel logo, original document graphics or photos of people. The graphics in `telefon/assets` were made for this project.

## License

All rights reserved. The project may not be copied, distributed or used, in whole or in part, without the author's written permission. The exception is the code in `telefon/` taken from the mobywatel.ai prototype, which remains under the MIT License. See `LICENSE` for details.
