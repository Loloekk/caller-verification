'use strict';

/* ---------- dane pokazu (fikcyjne) ---------- */
const WLASCICIEL = { imie: 'Marta Kowalska', numer: '600100200' };
const BANK = { nazwa: 'Bank Horyzont', pracownik: 'Anna Wiśniewska', rola: 'Konsultantka', infolinia: '800 100 100' };
const WAZNOSC_S = 120;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const ico = (n, extra = '') => `<svg class="i"${extra}><use href="#i-${n}"/></svg>`;
const hhmm = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const cyfry = s => String(s).replace(/\D/g, '');
const norm = s => String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
const fmtNum = d => d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
const fmtKod = d => d.slice(0, 3) + ' ' + d.slice(3);

let tryb = 'in';          // 'in' = Marta zalogowana, 'out' = aplikacja przed zalogowaniem
let kod = null;           // { kod, numer, imie, wygasa, uzyty }
let licznik = null;

/* ---------- komunikat na dole ekranu ---------- */
let toastT;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200);
}

/* ---------- okienka z informacjami ---------- */
function zamknijPopy(oprocz) {
  $$('.pop.on').forEach(p => { if (p.id !== oprocz) p.classList.remove('on'); });
  $$('[data-pop]').forEach(b => { if (b.dataset.pop !== oprocz) b.setAttribute('aria-expanded', 'false'); });
}
$$('[data-pop]').forEach(b => b.addEventListener('click', e => {
  e.stopPropagation();
  const p = document.getElementById(b.dataset.pop), otwarty = p.classList.contains('on');
  zamknijPopy(b.dataset.pop);
  if (otwarty) { p.classList.remove('on'); b.setAttribute('aria-expanded', 'false'); return; }
  p.classList.add('on'); b.setAttribute('aria-expanded', 'true');
  const r = b.getBoundingClientRect(), w = p.offsetWidth;
  p.style.left = Math.max(16, Math.min(r.left - 8, innerWidth - w - 16)) + scrollX + 'px';
  p.style.top = r.bottom + 10 + scrollY + 'px';
}));
document.addEventListener('click', e => { if (!e.target.closest('.pop')) zamknijPopy(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') zamknijPopy(); });

$('#animBtn').addEventListener('click', () => toast('Animacja tego scenariusza będzie w kolejnej wersji.'));

/* ---------- panel banku ---------- */
function statusBanku(rodzaj, ikona, tekst) {
  const s = $('#bankStatus');
  s.className = 'status' + (rodzaj ? ' ' + rodzaj : '');
  s.innerHTML = ico(ikona) + '<span></span>';
  s.querySelector('span').textContent = tekst;
}
function odliczaj() {
  clearInterval(licznik);
  const tik = () => {
    if (!kod || kod.uzyty) return clearInterval(licznik);
    const zostalo = Math.max(0, Math.round((kod.wygasa - Date.now()) / 1000));
    $('#timer').textContent = 'Ważny jeszcze ' + Math.floor(zostalo / 60) + ':' + String(zostalo % 60).padStart(2, '0');
    if (!zostalo) {
      clearInterval(licznik);
      $('#codebox').classList.add('expired');
      $('#timer').textContent = 'Kod wygasł';
      statusBanku('warn', 'alert', 'Kod wygasł, zanim klient go wpisał. Utwórz nowy, jeśli rozmowa trwa.');
    }
  };
  tik(); licznik = setInterval(tik, 1000);
}
$('#num').addEventListener('input', () => { $('#numErr').textContent = ''; });
$('#num').addEventListener('blur', () => {
  let d = cyfry($('#num').value); if (d.length === 11 && d.startsWith('48')) d = d.slice(2);
  if (d.length === 9) $('#num').value = fmtNum(d);
});
$('#bankForm').addEventListener('submit', e => {
  e.preventDefault();
  let d = cyfry($('#num').value); if (d.length === 11 && d.startsWith('48')) d = d.slice(2);
  if (d.length !== 9) { $('#numErr').textContent = 'Wpisz 9-cyfrowy numer telefonu.'; $('#num').focus(); return; }
  $('#num').value = fmtNum(d);
  const nowy = String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  kod = { kod: nowy, numer: d, imie: $('#kto').value.trim(), wygasa: Date.now() + WAZNOSC_S * 1000, uzyty: false };
  $('#codeArea').hidden = false;
  $('#codebox').classList.remove('expired');
  $('#codeTxt').textContent = fmtKod(nowy);
  $('#mkBtn').textContent = 'Utwórz nowy kod';
  statusBanku('', 'phone', 'Podaj kod klientowi w rozmowie. Czekam, aż wpisze go w mObywatelu.');
  odliczaj();
});

/* sprawdzenie kodu: to robi serwer mObywatela */
function sprawdz(wpisany) {
  if (!kod || kod.uzyty || wpisany !== kod.kod || Date.now() > kod.wygasa) return { stan: 'zly' };
  kod.uzyty = true; clearInterval(licznik);
  const godz = hhmm();
  $('#timer').textContent = 'Wykorzystany o ' + godz;
  if (kod.numer !== WLASCICIEL.numer) {
    statusBanku('bad', 'alert', 'Kod wpisano na innym numerze niż ten, pod który dzwonisz. Możliwe oszustwo, sprawa trafi do weryfikacji.');
    return { stan: 'numer', godz };
  }
  if (kod.imie && norm(kod.imie) !== norm(WLASCICIEL.imie)) {
    statusBanku('warn', 'alert', 'Numer zgadza się, ale należy do innej osoby niż Twój klient. Zakończ rozmowę bez podawania szczegółów.');
    return { stan: 'osoba', godz };
  }
  statusBanku('ok', 'check', 'Klient potwierdził rozmowę o ' + godz + '. Nie otrzymujesz żadnych jego danych.');
  return { stan: 'ok', godz };
}

/* ---------- telefon: ekrany ---------- */
const ekran = () => $('#screen');

function ekranLogowania() {
  ekran().innerHTML = `
  <div class="scr login">
    <div class="appicon">${ico('shield')}</div>
    <h1>mObywatel</h1>
    <p class="sub">Zaloguj się, żeby zobaczyć dokumenty</p>
    <label class="pw">
      <span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Hasło</span>
      <input type="password" id="pwIn" placeholder="Hasło" autocomplete="off">
      <button class="ibtn" type="button" id="faceBtn" aria-label="Zaloguj biometrią">${ico('face')}</button>
    </label>
    <div class="err" id="pwErr" style="margin:6px 4px 0"></div>
    <button class="btn red" type="button" id="loginBtn">Zaloguj się</button>
    <button class="link" type="button" id="forgotBtn">Nie pamiętam hasła</button>
    <div class="callcard">
      <div class="h"><div class="ico">${ico('phone')}</div><div><b>Ktoś do Ciebie dzwoni?</b><small>Sprawdź, czy to naprawdę bank albo urząd. Nie musisz się logować.</small></div></div>
      <button class="btn outline" type="button" id="checkBtn">Sprawdź, kto dzwoni</button>
    </div>
  </div>`;
  $('#loginBtn').onclick = () => {
    if ($('#pwIn').value.length < 8) { $('#pwErr').textContent = 'Hasło ma co najmniej 8 znaków. W pokazie możesz też użyć biometrii.'; return; }
    ustawTryb('in');
  };
  $('#pwIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('#loginBtn').click(); });
  $('#pwIn').addEventListener('input', () => { $('#pwErr').textContent = ''; });
  $('#faceBtn').onclick = () => ustawTryb('in');
  $('#forgotBtn').onclick = () => toast('Przypomnienie hasła nie jest częścią tego pokazu.');
  $('#checkBtn').onclick = otworzKod;
}

function ekranDomowy() {
  ekran().innerHTML = `
  <div class="scr">
    <div class="top"><div class="mini">${ico('shield')}</div><h2>Dokumenty</h2><span class="ibtn" aria-hidden="true" style="font-size:22px">${ico('bell')}</span></div>
    <div class="cards" aria-hidden="true">
      <div class="dcard c1"><b>Moje pojazdy</b><span class="ln">Toyota Corolla · WX 4521K</span></div>
      <div class="dcard c2"><b>mPrawo jazdy</b><span class="ln">Kategoria B</span></div>
      <div class="dcard c3"><b>mDowód</b><div class="row"><div class="ph">MK</div><div><div class="nm">MARTA KOWALSKA</div><div class="ln">Dowód ważny do 20.05.2031</div></div></div></div>
    </div>
    <button class="tile" type="button" id="checkBtn"><span class="ico">${ico('phone')}</span><span><b>Sprawdź, kto dzwoni</b><small>Bank albo urząd podał Ci kod w rozmowie</small></span><span class="chev">${ico('chev')}</span></button>
    <div class="remind" aria-hidden="true"><span class="dot">3</span><span>Pismo z Urzędu Skarbowego · i 2 inne sprawy</span></div>
    <div class="tabbar" aria-hidden="true">
      <span>${ico('home')}Pulpit</span><span class="on">${ico('docs')}Dokumenty</span><span>${ico('grid')}Usługi</span><span>${ico('qr')}Kod QR</span><span>${ico('dots')}Więcej</span>
    </div>
  </div>`;
  $('#checkBtn').onclick = otworzKod;
}

function pokazEkran() { tryb === 'in' ? ekranDomowy() : ekranLogowania(); }

/* ---------- arkusz: wpisywanie kodu ---------- */
let wpisany = '', faza = null;
const sheet = () => $('#sheet');

function zamknijArkusz() {
  sheet().classList.remove('on'); sheet().setAttribute('aria-hidden', 'true'); faza = null;
}
function otworzKod() {
  wpisany = ''; faza = 'kod';
  sheet().innerHTML = `
  <div class="sh-top"><button class="ibtn lg" type="button" id="shX" aria-label="Zamknij">${ico('x')}</button><b>Sprawdź, kto dzwoni</b><span style="width:34px"></span></div>
  <div class="sh-body">
    <h1>Wpisz kod od rozmówcy</h1>
    <p class="lead">Dzwoniący podaje kod w rozmowie. Sprawdzimy, kto dzwoni i czy na pewno do Ciebie.</p>
    <div class="digits" id="digits" aria-live="polite"></div>
    <div class="codeerr" id="codeErr" role="alert"></div>
    <div class="warnline">${ico('alert')}<span>Tutaj tylko wpisujesz kod usłyszany w rozmowie. Nigdy nikomu nie dyktuj kodów z mObywatela.</span></div>
    <div class="keypad" id="keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}
      <button type="button" class="blank" tabindex="-1" aria-hidden="true"></button>
      <button type="button" data-k="0">0</button>
      <button type="button" class="bs" data-k="bs" aria-label="Usuń cyfrę">${ico('bs')}</button>
    </div>
    <button class="btn go" type="button" id="goBtn" aria-disabled="true">Sprawdź</button>
  </div>`;
  sheet().classList.add('on'); sheet().setAttribute('aria-hidden', 'false');
  $('#shX').onclick = zamknijArkusz;
  $('#keypad').onclick = e => { const b = e.target.closest('[data-k]'); if (b) klawisz(b.dataset.k); };
  $('#goBtn').onclick = wyslij;
  rysujCyfry();
}
function rysujCyfry() {
  const d = $('#digits'); if (!d) return;
  let h = '';
  for (let i = 0; i < 6; i++) {
    if (i === 3) h += '<span class="gap"></span>';
    h += `<span class="${i === wpisany.length ? 'cur' : ''}">${wpisany[i] || ''}</span>`;
  }
  d.innerHTML = h;
  $('#goBtn').setAttribute('aria-disabled', wpisany.length === 6 ? 'false' : 'true');
}
function klawisz(k) {
  if (faza !== 'kod') return;
  $('#codeErr').textContent = '';
  if (k === 'bs') wpisany = wpisany.slice(0, -1);
  else if (wpisany.length < 6) wpisany += k;
  rysujCyfry();
}
document.addEventListener('keydown', e => {
  if (faza !== 'kod' || e.target.closest('input')) return;
  if (/^\d$/.test(e.key)) klawisz(e.key);
  else if (e.key === 'Backspace') klawisz('bs');
  else if (e.key === 'Enter') wyslij();
});

function wyslij() {
  if (faza !== 'kod') return;
  if (wpisany.length < 6) { $('#codeErr').textContent = 'Wpisz wszystkie 6 cyfr kodu.'; return; }
  const proba = wpisany; faza = 'sprawdzam';
  sheet().querySelector('.sh-body').outerHTML = `<div class="sh-body checking"><div class="spin"></div><div>Sprawdzam kod…</div></div>`;
  setTimeout(() => {
    const w = sprawdz(proba);
    if (w.stan === 'zly') {
      otworzKod();
      $('#codeErr').textContent = 'Ten kod jest nieprawidłowy albo wygasł. Jeśli rozmówca naciska, rozłącz się.';
      return;
    }
    wynik(w);
  }, 900);
}

function wiersze(rows) { return `<div class="who-calls">${rows.map(([k, v]) => `<div class="r"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`; }

function wynik(w) {
  faza = 'wynik';
  const zapis = tryb === 'in' ? `<div class="saved">${ico('check')}Zapisano w historii połączeń</div>` : '';
  let h;
  if (w.stan === 'ok') h = `
    <div class="big ok">${ico('check')}</div>
    <h1>Rozmowa potwierdzona</h1>
    <p class="lead">To naprawdę ${BANK.nazwa} i dzwoni właśnie do Ciebie.</p>
    ${wiersze([['Dzwoni', BANK.nazwa], [BANK.rola, BANK.pracownik], ['Twój numer', 'zgadza się'], ['Sprawdzono', 'dziś, ' + w.godz]])}
    ${zapis}
    <div class="warnline">${ico('shield')}<span>Bank nie dostał od mObywatela żadnych Twoich danych. Wie tylko, że rozmowa została potwierdzona.</span></div>
    <div class="btns"><button class="btn dark" type="button" id="doneBtn">Gotowe</button><button class="btn soft" type="button" id="callBtn">Wolę oddzwonić na oficjalny numer</button></div>`;
  else if (w.stan === 'numer') h = `
    <div class="big bad">${ico('alert')}</div>
    <h1>To może być oszustwo</h1>
    <p class="lead">Kod wydano dla innego numeru telefonu niż Twój. Ktoś mógł przekazać Ci kod od prawdziwego banku.</p>
    <div class="btns"><button class="btn redfull" type="button" id="callBtn">Rozłącz i oddzwoń do banku</button><button class="btn soft" type="button" id="reportBtn">Zgłoś oszustwo</button><button class="btn soft" type="button" id="doneBtn">Zamknij</button></div>`;
  else h = `
    <div class="big warn">${ico('user')}</div>
    <h1>Bank szuka innej osoby</h1>
    <p class="lead">Dzwoni naprawdę ${BANK.nazwa}, ale do poprzedniego właściciela Twojego numeru. Nie podawaj swoich danych.</p>
    ${wiersze([['Dzwoni', BANK.nazwa], [BANK.rola, BANK.pracownik]])}
    <div class="btns"><button class="btn dark" type="button" id="doneBtn">Gotowe</button></div>`;
  sheet().querySelector('.sh-body').outerHTML = `<div class="sh-body result">${h}</div>`;
  $('#doneBtn').onclick = zamknijArkusz;
  const call = $('#callBtn'); if (call) call.onclick = () => toast(`Rozłączam i dzwonię na infolinię: ${BANK.nazwa}, ${BANK.infolinia}.`);
  const rep = $('#reportBtn'); if (rep) rep.onclick = () => toast('Zgłoszenie trafi do CERT Polska i do banku.');
}

/* ---------- wybór stanu aplikacji ---------- */
function ustawTryb(t) {
  tryb = t;
  $$('.opt').forEach(o => { const on = o.dataset.mode === t; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on); });
  zamknijArkusz(); pokazEkran();
}
$$('.opt').forEach(o => o.addEventListener('click', () => ustawTryb(o.dataset.mode)));

/* ---------- zegar i skalowanie telefonu ---------- */
function zegar() { $('#clock').textContent = hhmm(); }
zegar(); setInterval(zegar, 15000);

function dopasuj() {
  const top = $('.topbar').offsetHeight;
  const vw = document.documentElement.clientWidth || innerWidth;
  const s = vw <= 760
    ? Math.min(1, (Math.min(vw, 452) - 32 - 22) / 390)
    : Math.min(1, Math.max(0.55, (innerHeight - top - 110) / 844));
  const wrap = $('#phoneWrap');
  wrap.style.width = 390 * s + 'px'; wrap.style.height = 844 * s + 'px';
  $('#phone').style.transform = `scale(${s})`;
}
addEventListener('resize', dopasuj);
if ('ResizeObserver' in window) new ResizeObserver(dopasuj).observe(document.documentElement);

ustawTryb('in');
dopasuj();
