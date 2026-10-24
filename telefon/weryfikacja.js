/* Sprawdź, kto dzwoni: dodatek do skopiowanej aplikacji z prototypu mobywatel.ai.
   - ekran logowania (stan „przed zalogowaniem”) z kartą „Ktoś do Ciebie dzwoni?”,
   - wiersz „Sprawdź, kto dzwoni” na ekranie głównym, nad sprawami do załatwienia,
   - wpisywanie kodu od dzwoniącego i wynik sprawdzenia,
   - oznaczenia funkcji, które wymagają modelu AI (w tej pracy niewspierane).
   Telefon rozmawia ze stroną banku (rodzicem) przez postMessage, więc działa też z pliku. */
(function () {
  'use strict';
  const app = document.getElementById('app');
  const NUMERY = { marta: '600100200', jan: '601234567', ewa: '602345678', kacper: '700100200' };
  const DOPELNIACZ = { marta: 'Marty', jan: 'Jana', ewa: 'Ewy', kacper: 'Kacpra' };
  const numer = NUMERY[OS.id] || NUMERY.marta;
  const fmtNum = d => d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  const wRamce = window.parent !== window;
  let tryb = 'in';

  /* ---------- wersja angielska: teksty tego dodatku, dopisane do słownika prototypu ---------- */
  if (window.LANG === 'en' && window.I18N) Object.assign(window.I18N, {
   "Wymaga modelu AI": "Requires an AI model",
   "Swobodna rozmowa z asystentem nie jest wspierana w tej pracy. Działają przygotowane scenariusze.": "Free conversation with the assistant is not supported in this project. The prepared scenarios work.",
   "Rozpoznawanie mowy nie jest wspierane w tej pracy. Odtwarzam przykładowe zdanie.": "Speech recognition is not supported in this project. Playing a sample sentence.",
   "Odczyt zdjęcia nie jest wspierany w tej pracy. Używam przykładowego zdjęcia dowodu rejestracyjnego.": "Reading photos is not supported in this project. Using a sample photo of a vehicle registration certificate.",
   "Sprawdź, kto dzwoni": "Check who's calling",
   "Bank albo urząd podał Ci kod w rozmowie": "A bank or office gave you a code during a call",
   "Zaloguj się, żeby zobaczyć dokumenty": "Log in to see your documents",
   "Hasło": "Password",
   "Zaloguj biometrią": "Log in with biometrics",
   "Zaloguj się": "Log in",
   "Nie pamiętam hasła": "Forgot password",
   "Ktoś do Ciebie dzwoni?": "Is someone calling you?",
   "Sprawdź, czy to naprawdę bank albo urząd. Nie musisz się logować.": "Check whether it really is a bank or an office. You don't need to log in.",
   "Hasło ma co najmniej {0} znaków. W pokazie możesz też użyć biometrii.": "The password has at least {0} characters. In the demo you can also use biometrics.",
   "Poza pokazem": "Outside the demo",
   "Przypomnienie hasła nie jest częścią tej pracy.": "Password recovery is not part of this project.",
   "Zamknij": "Close",
   "Wpisz kod od rozmówcy": "Enter the caller's code",
   "Dzwoniący podaje kod w rozmowie. Sprawdzimy, kto dzwoni i czy na pewno do Ciebie.": "The caller gives you a code during the call. We'll check who is calling and whether the call is really meant for you.",
   "Tutaj tylko wpisujesz kod usłyszany w rozmowie. Nigdy nikomu nie dyktuj kodów z mObywatela.": "Here you only enter a code you heard during the call. Never read out codes from mObywatel to anyone.",
   "Usuń cyfrę": "Delete digit",
   "Sprawdź": "Check",
   "Wpisz wszystkie {0} cyfr kodu.": "Enter all {0} digits of the code.",
   "Sprawdzam kod…": "Checking the code…",
   "Zapisano w historii połączeń": "Saved in call history",
   "Zakończ rozmowę i zadzwoń na infolinię banku": "End the call and phone the bank's helpline",
   "Nie wiemy, kto dzwoni. Zakończ rozmowę i nie podawaj żadnych danych.": "We don't know who is calling. End the call and don't share any details.",
   "Rozmowa potwierdzona": "Call confirmed",
   "To naprawdę bank i dzwoni właśnie do Ciebie.": "It really is the bank, and it is calling you specifically.",
   "To naprawdę bank i dzwoni pod Twój numer.": "It really is the bank, and it is calling your number.",
   "Dzwoni": "Caller",
   "Bank": "Bank",
   "Bank ABC": "Bank ABC",
   "Konsultantka": "Consultant",
   "Anna Wiśniewska": "Anna Wiśniewska",
   "Twój numer": "Your number",
   "zgadza się": "matches",
   "Sprawdzono": "Checked",
   "dziś, {0}": "today, {0}",
   "Bank nie dostał od mObywatela żadnych Twoich danych. Wie tylko, że rozmowa została potwierdzona.": "The bank received none of your data from mObywatel. It only knows that the call was confirmed.",
   "Bank nie zna Twojego imienia i nazwiska. Upewnij się, że chciał dodzwonić się właśnie do Ciebie.": "The bank doesn't know your name. Make sure it really meant to reach you.",
   "Gotowe": "Done",
   "To może być oszustwo": "This may be a scam",
   "Ten kod nie potwierdza rozmowy, więc nie wiemy, kto dzwoni. Kodu nie ma w systemie albo już wygasł.": "This code doesn't confirm the call, so we don't know who is calling. The code isn't in the system or has already expired.",
   "Wpisany kod": "Code entered",
   "Jeżeli kod został wpisany błędnie, spróbuj jeszcze raz. Zostały {0} próby. Jeśli rozmówca naciska albo się spieszy, zakończ rozmowę.": "If you mistyped the code, try again. You have {0} attempts left. If the caller is pushing you or in a hurry, end the call.",
   "Jeżeli kod został wpisany błędnie, spróbuj jeszcze raz. Została ostatnia próba. Jeśli rozmówca naciska albo się spieszy, zakończ rozmowę.": "If you mistyped the code, try again. This is your last attempt. If the caller is pushing you or in a hurry, end the call.",
   "Spróbuj jeszcze raz": "Try again",
   "Zgłoś oszustwo": "Report fraud",
   "Kod wygasł": "Code expired",
   "Ten kod był prawdziwy, ale jest ważny tylko przez dwie minuty. Poproś rozmówcę o nowy kod.": "This code was genuine, but it is only valid for two minutes. Ask the caller for a new code.",
   "Wygaśnięcie kodu nie oznacza oszustwa. Jeśli jednak rozmówca naciska, zakończ rozmowę.": "An expired code doesn't mean fraud. But if the caller is pushing you, end the call.",
   "Wpisz nowy kod": "Enter a new code",
   "Za dużo błędnych prób": "Too many wrong attempts",
   "Pięć razy wpisano kod, który nie potwierdza rozmowy. Sprawdzanie jest wstrzymane do {0}.": "A code that doesn't confirm the call was entered five times. Checking is paused until {0}.",
   "Prawdziwa instytucja nie musi prosić o kolejne próby.": "A real institution has no reason to ask for more attempts.",
   "Kod wydał bank, ale dla innego numeru telefonu niż Twój. Ktoś mógł przekazać Ci kod od prawdziwego banku.": "The code was issued by a bank, but for a different phone number than yours. Someone may have passed on a code from a real bank.",
   "Bank szuka innej osoby": "The bank is looking for someone else",
   "Dzwoni naprawdę bank, ale szuka innej osoby, na przykład poprzedniego właściciela Twojego numeru.": "It really is the bank calling, but it is looking for someone else, for example the previous owner of your number.",
   "Powiedz konsultantowi, że to pomyłka. Nie podawaj swoich danych.": "Tell the consultant it's a mistake. Don't share your details.",
   "Brak połączenia z bankiem": "No connection to the bank",
   "Ten telefon jest otwarty bez strony banku. Otwórz pokaz od strony głównej, żeby sprawdzić kod.": "This phone is open without the bank page. Open the demo from the main page to check the code.",
   "Tu zgłoszenie trafiłoby do CERT Polska i do banku, który wydał kod.": "Here the report would go to CERT Polska and to the bank that issued the code.",
   "Tu zgłoszenie trafiłoby do CERT Polska.": "Here the report would go to CERT Polska.",
   "Telefon z mObywatelem": "Phone with mObywatel",
   "Wersja bez serwera: skaner widzi znaki otwarte w innych kartach tej przeglądarki.": "Serverless version: the scanner sees signs open in other tabs of this browser.",
   "Wersja bez serwera: otwórz znak w drugiej karcie tej przeglądarki, na przykład stronę wypożyczalni, a pojawi się tutaj do zeskanowania.": "Serverless version: open a sign in another tab of this browser, for example the rental page, and it will appear here to scan."
  });

  const I = {
    shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/><path d="m15 4 2 2 4-4"/>',
    face: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16a3.5 3.5 0 0 0 5 0"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    bs: '<path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z"/><path d="m11.5 9.5 5 5M16.5 9.5l-5 5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>',
    chev: '<path d="m9.5 6 6 6-6 6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ai: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 15.5 11 8.5h2l2 7M9.8 13h4.4"/>'
  };
  const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const el = h => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
  const hhmm = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const doRodzica = msg => { if (wRamce) window.parent.postMessage(Object.assign({ zrodlo: 'telefon' }, msg), '*'); };

  /* ---------- oznaczenie: funkcja wymaga modelu AI ---------- */
  let notaT;
  function niewspierane(tytul, opis) {
    let n = document.getElementById('wfNota');
    if (!n) { n = el('<div class="wf-nota" id="wfNota" role="status"></div>'); app.append(n); }
    n.innerHTML = `<span class="wf-nota-ic">${ico('ai')}</span><span><b></b><small></small></span>`;
    n.querySelector('b').textContent = tytul;
    n.querySelector('small').textContent = opis;
    n.classList.add('on'); clearTimeout(notaT); notaT = setTimeout(() => n.classList.remove('on'), 4200);
  }
  window.niewspierane = niewspierane;

  // swobodna rozmowa: tryb skryptowy zna tylko przygotowane scenariusze
  if (typeof S !== 'undefined' && S.fallback) {
    const fb = S.fallback;
    S.fallback = async function () {
      niewspierane('Wymaga modelu AI', 'Swobodna rozmowa z asystentem nie jest wspierana w tej pracy. Działają przygotowane scenariusze.');
      return fb.apply(this, arguments);
    };
  }
  // mikrofon i aparat: w trybie skryptowym odtwarzają przykład zamiast prawdziwego rozpoznawania
  const mic = document.getElementById('mic');
  if (mic && mic.onclick) {
    const o = mic.onclick;
    mic.onclick = function () { niewspierane('Wymaga modelu AI', 'Rozpoznawanie mowy nie jest wspierane w tej pracy. Odtwarzam przykładowe zdanie.'); return o.apply(this, arguments); };
  }
  const cam = document.getElementById('cam');
  if (cam && cam.onclick) {
    const o = cam.onclick;
    cam.onclick = function () { niewspierane('Wymaga modelu AI', 'Odczyt zdjęcia nie jest wspierany w tej pracy. Używam przykładowego zdjęcia dowodu rejestracyjnego.'); return o.apply(this, arguments); };
  }

  /* ---------- wiersz „Sprawdź, kto dzwoni” na ekranie głównym ---------- */
  const rem = document.getElementById('reminders');
  if (rem) {
    const w = el(`<button type="button" class="rsum wf-kto" id="wfKto"><span class="wf-ki">${ico('phone')}</span><span class="tx"><b>Sprawdź, kto dzwoni</b><small>Bank albo urząd podał Ci kod w rozmowie</small></span>${ico('chev')}</button>`);
    rem.insertBefore(w, rem.firstChild);
    w.onclick = otworzKod;
    if (typeof layout === 'function') layout();
  }

  /* ---------- ekran logowania ---------- */
  const lock = el(`
  <div class="wf-lock" id="wfLock" aria-hidden="true">
    <div class="wf-appicon">${ico('shield')}</div>
    <h1>mObywatel</h1>
    <p class="wf-sub">Zaloguj się, żeby zobaczyć dokumenty</p>
    <label class="wf-pw">
      <span class="wf-sr">Hasło</span>
      <input type="password" id="wfPw" placeholder="Hasło" autocomplete="off">
      <button type="button" class="wf-ibtn" id="wfFace" aria-label="Zaloguj biometrią">${ico('face')}</button>
    </label>
    <div class="wf-err" id="wfPwErr"></div>
    <button type="button" class="wf-btn wf-red" id="wfLogin">Zaloguj się</button>
    <button type="button" class="wf-link" id="wfForgot">Nie pamiętam hasła</button>
    <div class="wf-callcard">
      <div class="wf-h"><span class="wf-ico">${ico('phone')}</span><span><b>Ktoś do Ciebie dzwoni?</b><small>Sprawdź, czy to naprawdę bank albo urząd. Nie musisz się logować.</small></span></div>
      <button type="button" class="wf-btn wf-outline" id="wfCheck">Sprawdź, kto dzwoni</button>
    </div>
  </div>`);
  app.append(lock);
  const zaloguj = () => { ustawTryb('in'); doRodzica({ typ: 'wf-zalogowano' }); };
  lock.querySelector('#wfLogin').onclick = () => {
    if (lock.querySelector('#wfPw').value.length < 8) { lock.querySelector('#wfPwErr').textContent = 'Hasło ma co najmniej 8 znaków. W pokazie możesz też użyć biometrii.'; return; }
    zaloguj();
  };
  lock.querySelector('#wfPw').addEventListener('keydown', e => { if (e.key === 'Enter') lock.querySelector('#wfLogin').click(); });
  lock.querySelector('#wfPw').addEventListener('input', () => { lock.querySelector('#wfPwErr').textContent = ''; });
  lock.querySelector('#wfFace').onclick = () => (typeof faceid === 'function' ? faceid() : Promise.resolve()).then(zaloguj);
  lock.querySelector('#wfForgot').onclick = () => niewspierane('Poza pokazem', 'Przypomnienie hasła nie jest częścią tej pracy.');
  lock.querySelector('#wfCheck').onclick = otworzKod;

  function ustawTryb(t) {
    const nowy = t === 'out' ? 'out' : 'in', zmiana = nowy !== tryb;
    tryb = nowy;
    lock.classList.toggle('on', tryb === 'out'); lock.setAttribute('aria-hidden', tryb !== 'out');
    if (!zmiana) return;   // ten sam stan: nie zamykamy otwartego wyniku
    if (tryb === 'out') { lock.querySelector('#wfPw').value = ''; lock.querySelector('#wfPwErr').textContent = ''; }
    zamknijArkusz();
  }

  /* ---------- arkusz: wpisywanie kodu i wynik ---------- */
  const sheet = el('<div class="wf-sheet" id="wfSheet" aria-hidden="true"></div>');
  app.append(sheet);
  let wpisany = '', faza = null, nrProby = 0;

  function zamknijArkusz() { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); faza = null; }
  function otworzKod() {
    wpisany = ''; faza = 'kod';
    sheet.innerHTML = `
    <div class="wf-sh-top"><button type="button" class="wf-ibtn wf-lg" id="wfX" aria-label="Zamknij">${ico('x')}</button><b>Sprawdź, kto dzwoni</b><span style="width:34px"></span></div>
    <div class="wf-sh-body">
      <h1>Wpisz kod od rozmówcy</h1>
      <p class="wf-lead">Dzwoniący podaje kod w rozmowie. Sprawdzimy, kto dzwoni i czy na pewno do Ciebie.</p>
      <div class="wf-digits" id="wfDigits" aria-live="polite"></div>
      <div class="wf-codeerr" id="wfCodeErr" role="alert"></div>
      <div class="wf-warn">${ico('alert')}<span>Tutaj tylko wpisujesz kod usłyszany w rozmowie. Nigdy nikomu nie dyktuj kodów z mObywatela.</span></div>
      <div class="wf-keypad" id="wfKeypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}
        <span></span><button type="button" data-k="0">0</button>
        <button type="button" class="wf-bs" data-k="bs" aria-label="Usuń cyfrę">${ico('bs')}</button>
      </div>
      <button type="button" class="wf-btn wf-go" id="wfGo" aria-disabled="true">Sprawdź</button>
    </div>`;
    sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
    sheet.querySelector('#wfX').onclick = zamknijArkusz;
    sheet.querySelector('#wfKeypad').onclick = e => { const b = e.target.closest('[data-k]'); if (b) klawisz(b.dataset.k); };
    sheet.querySelector('#wfGo').onclick = wyslij;
    rysujCyfry();
  }
  function rysujCyfry() {
    const d = sheet.querySelector('#wfDigits'); if (!d) return;
    let h = '';
    for (let i = 0; i < 6; i++) { if (i === 3) h += '<i></i>'; h += `<span class="${i === wpisany.length ? 'cur' : ''}">${wpisany[i] || ''}</span>`; }
    d.innerHTML = h;
    sheet.querySelector('#wfGo').setAttribute('aria-disabled', wpisany.length === 6 ? 'false' : 'true');
  }
  function klawisz(k) {
    if (faza !== 'kod') return;
    sheet.querySelector('#wfCodeErr').textContent = '';
    if (k === 'bs') wpisany = wpisany.slice(0, -1); else if (wpisany.length < 6) wpisany += k;
    rysujCyfry();
  }
  document.addEventListener('keydown', e => {
    if (faza !== 'kod' || e.target.closest('input')) return;
    if (/^\d$/.test(e.key)) klawisz(e.key);
    else if (e.key === 'Backspace') klawisz('bs');
    else if (e.key === 'Enter') wyslij();
  });

  const czekajace = {};
  function wyslij() {
    if (faza !== 'kod') return;
    if (wpisany.length < 6) { sheet.querySelector('#wfCodeErr').textContent = 'Wpisz wszystkie 6 cyfr kodu.'; return; }
    faza = 'sprawdzam';
    const id = ++nrProby, kod = wpisany;
    sheet.querySelector('.wf-sh-body').outerHTML = '<div class="wf-sh-body wf-checking"><div class="wf-spin"></div><div>Sprawdzam kod…</div></div>';
    const start = Date.now();
    new Promise(res => {
      if (!wRamce) return res({ stan: 'brak' });
      czekajace[id] = res;
      doRodzica({ typ: 'wf-sprawdz', id, kod, numer, imie: OS.imie + ' ' + OS.nazwisko });
      setTimeout(() => { if (czekajace[id]) { delete czekajace[id]; res({ stan: 'brak' }); } }, 3000);
    }).then(w => setTimeout(() => {
      wynik(Object.assign({ kod }, w));
    }, Math.max(0, 900 - (Date.now() - start))));
  }

  const wiersze = rows => `<div class="wf-rows">${rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
  function wynik(w) {
    faza = 'wynik';
    const b = w.bank || {};
    const zapis = tryb === 'in' ? `<div class="wf-saved">${ico('check')}Zapisano w historii połączeń</div>` : '';
    // Infolinię banku pokazujemy tylko wtedy, gdy kod wydał bank, ale dla innego numeru (rozmówca może nie być bankiem).
    // Gdy kod potwierdza rozmowę, rozmawiamy już z bankiem. Przy nieznanym kodzie nie wiemy, kto dzwoni.
    const infolinia = `<div class="wf-zadzwon">${ico('phone')}<span>Zakończ rozmowę i zadzwoń na infolinię banku<b>${b.infolinia || ''}</b></span></div>`;
    const nieWiemy = `<div class="wf-zadzwon">${ico('alert')}<span>Nie wiemy, kto dzwoni. Zakończ rozmowę i nie podawaj żadnych danych.</span></div>`;
    let h;
    if (w.stan === 'ok') h = `
      <div class="wf-big ok">${ico('check')}</div>
      <h1>Rozmowa potwierdzona</h1>
      <p class="wf-lead">${w.znaImie ? 'To naprawdę bank i dzwoni właśnie do Ciebie.' : 'To naprawdę bank i dzwoni pod Twój numer.'}</p>
      ${wiersze([['Dzwoni', b.nazwa], [b.rola, b.pracownik], ['Twój numer', 'zgadza się'], ['Sprawdzono', 'dziś, ' + w.godz]])}
      ${zapis}
      ${w.znaImie
        ? `<div class="wf-warn">${ico('shield')}<span>Bank nie dostał od mObywatela żadnych Twoich danych. Wie tylko, że rozmowa została potwierdzona.</span></div>`
        : `<div class="wf-uwaga">${ico('user')}<span>Bank nie zna Twojego imienia i nazwiska. Upewnij się, że chciał dodzwonić się właśnie do Ciebie.</span></div>`}
      <div class="wf-btns"><button type="button" class="wf-btn wf-dark" id="wfDone">Gotowe</button></div>`;
    else if (w.stan === 'zly') h = `
      <div class="wf-big bad">${ico('alert')}</div>
      <h1>To może być oszustwo</h1>
      <p class="wf-lead">Ten kod nie potwierdza rozmowy, więc nie wiemy, kto dzwoni. Kodu nie ma w systemie albo już wygasł.</p>
      <div class="wf-wpisany"><small>Wpisany kod</small><b>${w.kod.slice(0, 3) + ' ' + w.kod.slice(3)}</b></div>
      <div class="wf-warn">${ico('alert')}<span>Jeżeli kod został wpisany błędnie, spróbuj jeszcze raz. ${w.zostalo === 1 ? 'Została ostatnia próba.' : 'Zostały ' + w.zostalo + ' próby.'} Jeśli rozmówca naciska albo się spieszy, zakończ rozmowę.</span></div>
      <div class="wf-btns"><button type="button" class="wf-btn wf-dark" id="wfRetry">Spróbuj jeszcze raz</button>${nieWiemy}<button type="button" class="wf-btn wf-soft" id="wfReport">Zgłoś oszustwo</button><button type="button" class="wf-btn wf-soft" id="wfDone">Zamknij</button></div>`;
    else if (w.stan === 'wygasl') h = `
      <div class="wf-big warn">${ico('clock')}</div>
      <h1>Kod wygasł</h1>
      <p class="wf-lead">Ten kod był prawdziwy, ale jest ważny tylko przez dwie minuty. Poproś rozmówcę o nowy kod.</p>
      <div class="wf-warn">${ico('shield')}<span>Wygaśnięcie kodu nie oznacza oszustwa. Jeśli jednak rozmówca naciska, zakończ rozmowę.</span></div>
      <div class="wf-btns"><button type="button" class="wf-btn wf-dark" id="wfRetry">Wpisz nowy kod</button><button type="button" class="wf-btn wf-soft" id="wfDone">Zamknij</button></div>`;
    else if (w.stan === 'blokada') h = `
      <div class="wf-big bad">${ico('lock')}</div>
      <h1>Za dużo błędnych prób</h1>
      <p class="wf-lead">Pięć razy wpisano kod, który nie potwierdza rozmowy. Sprawdzanie jest wstrzymane do ${w.do}.</p>
      <div class="wf-warn">${ico('alert')}<span>Prawdziwa instytucja nie musi prosić o kolejne próby.</span></div>
      <div class="wf-btns">${nieWiemy}<button type="button" class="wf-btn wf-soft" id="wfReport">Zgłoś oszustwo</button><button type="button" class="wf-btn wf-soft" id="wfDone">Zamknij</button></div>`;
    else if (w.stan === 'numer') h = `
      <div class="wf-big bad">${ico('alert')}</div>
      <h1>To może być oszustwo</h1>
      <p class="wf-lead">Kod wydał bank, ale dla innego numeru telefonu niż Twój. Ktoś mógł przekazać Ci kod od prawdziwego banku.</p>
      <div class="wf-btns">${infolinia}<button type="button" class="wf-btn wf-soft" id="wfReport">Zgłoś oszustwo</button><button type="button" class="wf-btn wf-soft" id="wfDone">Zamknij</button></div>`;
    else if (w.stan === 'osoba') h = `
      <div class="wf-big warn">${ico('user')}</div>
      <h1>Bank szuka innej osoby</h1>
      <p class="wf-lead">Dzwoni naprawdę bank, ale szuka innej osoby, na przykład poprzedniego właściciela Twojego numeru.</p>
      ${wiersze([['Dzwoni', b.nazwa], [b.rola, b.pracownik]])}
      <div class="wf-uwaga">${ico('user')}<span>Powiedz konsultantowi, że to pomyłka. Nie podawaj swoich danych.</span></div>
      <div class="wf-btns"><button type="button" class="wf-btn wf-dark" id="wfDone">Gotowe</button></div>`;
    else h = `
      <div class="wf-big warn">${ico('alert')}</div>
      <h1>Brak połączenia z bankiem</h1>
      <p class="wf-lead">Ten telefon jest otwarty bez strony banku. Otwórz pokaz od strony głównej, żeby sprawdzić kod.</p>
      <div class="wf-btns"><button type="button" class="wf-btn wf-dark" id="wfDone">Zamknij</button></div>`;
    sheet.querySelector('.wf-sh-body').outerHTML = `<div class="wf-sh-body wf-result">${h}</div>`;
    const dn = sheet.querySelector('#wfDone'); if (dn) dn.onclick = zamknijArkusz;
    const rt = sheet.querySelector('#wfRetry'); if (rt) rt.onclick = otworzKod;
    const r = sheet.querySelector('#wfReport'); if (r) r.onclick = () => niewspierane('Poza pokazem', w.stan === 'numer' ? 'Tu zgłoszenie trafiłoby do CERT Polska i do banku, który wydał kod.' : 'Tu zgłoszenie trafiłoby do CERT Polska.');
  }

  /* ---------- skaner znaku bez serwera: znaki z innych kart tej przeglądarki ---------- */
  function aktywneZnaki() {
    try {
      const s = JSON.parse(localStorage.getItem('mobZnakLokalnie')) || { devs: {} }, t = Date.now() / 1000;
      return Object.entries(s.devs).filter(([d, v]) => d !== DEV && t - v.t < 15).map(([d, v]) => ({ token: v.token, kto: v.kto || 'Telefon z mObywatelem', kind: v.kind }));
    } catch (e) { return []; }
  }
  function dodajSymulacje(q) {
    const foot = q.querySelector('.qscanfoot'); if (!foot || foot.querySelector('.wf-sym')) return;
    const box = el('<div class="wf-sym"></div>'); foot.prepend(box);
    const rysuj = () => {
      const z = aktywneZnaki();
      box.innerHTML = z.length
        ? z.map((x, i) => `<button type="button" data-i="${i}">Zeskanuj znak z drugiej karty: ${x.kto.replace(/[<>&]/g, '')}</button>`).join('') + '<small>Wersja bez serwera: skaner widzi znaki otwarte w innych kartach tej przeglądarki.</small>'
        : '<small>Wersja bez serwera: otwórz znak w drugiej karcie tej przeglądarki, na przykład stronę wypożyczalni, a pojawi się tutaj do zeskanowania.</small>';
      box.querySelectorAll('button').forEach(b => b.onclick = () => {
        const x = z[+b.dataset.i];
        fetch('/api/znak/kto?t=' + x.token + '&dev=' + DEV).then(r => r.json()).then(j => {
          if (j && j.dev && typeof pConsent === 'function') { pStopCam(); pConsent(j); }
          else rysuj();
        });
      });
    };
    rysuj();
    const t = setInterval(() => { if (!document.body.contains(box)) return clearInterval(t); if (!box.contains(document.activeElement)) rysuj(); }, 1500);
  }
  new MutationObserver(() => { const q = document.querySelector('#qrx.scan.on'); if (q) dodajSymulacje(q); })
    .observe(app, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

  /* ---------- widoczne stuknięcie palcem (dla animacji na stronie pokazu) ---------- */
  function stuknij(cel) {
    if (!cel) return;
    const r = cel.getBoundingClientRect(), a = app.getBoundingClientRect();
    const k = document.createElement('span');
    k.className = 'wf-tap';
    k.style.left = r.left - a.left + r.width / 2 + 'px';
    k.style.top = r.top - a.top + r.height / 2 + 'px';
    app.append(k);
    cel.classList.add('wf-wcisniety');
    setTimeout(() => cel.classList.remove('wf-wcisniety'), 260);
    setTimeout(() => k.remove(), 700);
  }

  /* ---------- rozmowa ze stroną banku ---------- */
  window.addEventListener('message', e => {
    const m = e.data || {};
    if (m.zrodlo !== 'bank') return;
    if (m.typ === 'wf-tryb') ustawTryb(m.tryb);
    if (m.typ === 'wf-wynik' && czekajace[m.id]) { czekajace[m.id](m.wynik); delete czekajace[m.id]; }
    // animacja rozmowy na stronie pokazu steruje telefonem: otwiera sprawdzanie, wpisuje cyfry, wysyła kod
    if (m.typ === 'wf-demo') {
      if (m.krok === 'otworz') { stuknij(document.getElementById('wfKto')); setTimeout(otworzKod, 450); }
      if (m.krok === 'cyfra') { stuknij(sheet.querySelector(`#wfKeypad [data-k="${m.c}"]`)); klawisz(String(m.c)); }
      if (m.krok === 'wyslij') { stuknij(sheet.querySelector('#wfGo')); setTimeout(wyslij, 300); }
      if (m.krok === 'zamknij') zamknijArkusz();
    }
  });
  // tłumaczenie z prototypu (i18n.js) trzeba uruchomić; w polskiej wersji funkcji nie ma
  if (typeof window.__i18nStart === 'function') window.__i18nStart();
  doRodzica({ typ: 'wf-gotowy', osoba: OS.id, imie: OS.imie, nazwisko: OS.nazwisko, plec: OS.plec, dopelniacz: DOPELNIACZ[OS.id] || OS.imie, numer, numerTxt: fmtNum(numer) });
})();
