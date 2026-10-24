'use strict';

/* Strona pokazu: system banku po lewej, telefon po prawej.
   Telefon to aplikacja skopiowana z prototypu mobywatel.ai (folder telefon/) z dodatkiem weryfikacji.
   Strona banku i telefon rozmawiają przez postMessage. */

/* ---------- dane pokazu (fikcyjne) ---------- */
const BANK = { nazwa: 'Bank', pracownik: 'Anna Wiśniewska', rola: 'Konsultantka', infolinia: '800 100 100' };
const WAZNOSC_S = 120;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const ico = n => `<svg class="i"><use href="#i-${n}"/></svg>`;
const hhmm = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const cyfry = s => String(s).replace(/\D/g, '');
const norm = s => String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
const fmtNum = d => d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
const fmtKod = d => d.slice(0, 3) + ' ' + d.slice(3);

let tryb = 'in';          // 'in' = użytkownik zalogowany, 'out' = aplikacja przed zalogowaniem
let kod = null;           // { kod, numer, imie, wygasa, uzyty }
let licznik = null;

/* ---------- komunikat na dole ekranu ---------- */
let toastT;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200);
}

/* ---------- okienka z informacjami ---------- */
// przesunięcie i skala, które sprowadzają okno do przycisku „i”
const doPrzycisku = (p, b) => {
  const r = p.getBoundingClientRect(), c = b.getBoundingClientRect();
  return `translate(${c.left + c.width / 2 - (r.left + r.width / 2)}px,${c.top + c.height / 2 - (r.top + r.height / 2)}px) scale(.04)`;
};
const bezRuchu = () => !Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches;

// okno wstępu stoi na środku ekranu; po kliknięciu „i” wyrasta z tego przycisku
function otworzPop(b, zPrzycisku) {
  const p = document.getElementById(b.dataset.pop);
  zamknijPopy(b.dataset.pop);
  p.getAnimations && p.getAnimations().forEach(a => a.cancel());
  delete p.dataset.zwija;
  p.classList.add('on'); $('.pop-tlo').classList.add('on'); b.setAttribute('aria-expanded', 'true');
  if (zPrzycisku && !bezRuchu())
    p.animate([{ transform: doPrzycisku(p, b), opacity: .2 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
// okno kurczy się i wlatuje do przycisku „i”, a przycisk na koniec lekko pulsuje
function zwinPop(p) {
  const b = document.querySelector(`[data-pop="${p.id}"]`);
  b && b.setAttribute('aria-expanded', 'false');
  $('.pop-tlo').classList.remove('on');
  if (p.dataset.zwija) return;
  if (!b || bezRuchu()) { p.classList.remove('on'); return; }
  p.dataset.zwija = '1';
  const a = p.animate([{ transform: 'none', opacity: 1 }, { transform: doPrzycisku(p, b), opacity: .2 }],
    { duration: 480, easing: 'cubic-bezier(.55,0,.8,.2)', fill: 'forwards' });
  const koniec = () => {
    if (!p.dataset.zwija) return;
    p.classList.remove('on'); a.cancel(); delete p.dataset.zwija;
    b.classList.remove('puls'); void b.offsetWidth; b.classList.add('puls');
  };
  a.onfinish = koniec;
  setTimeout(koniec, 700);   // gdy przeglądarka wstrzyma klatki, okienko i tak się zamknie
}
function zamknijPopy(oprocz) {
  $$('.pop.on').forEach(p => { if (p.id !== oprocz) zwinPop(p); });
}
$$('[data-pop]').forEach(b => b.addEventListener('click', e => {
  e.stopPropagation();
  const p = document.getElementById(b.dataset.pop);
  if (p.classList.contains('on') && !p.dataset.zwija) zwinPop(p); else otworzPop(b, true);
}));
$$('.pop-zwin').forEach(z => z.addEventListener('click', () => zwinPop(z.closest('.pop'))));
document.addEventListener('click', e => { if (!e.target.closest('.pop')) zamknijPopy(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') zamknijPopy(); });


/* ---------- strona banku ---------- */
$('#bankInfolinia').textContent = BANK.infolinia;
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
const numerZPola = () => { let d = cyfry($('#num').value); if (d.length === 11 && d.startsWith('48')) d = d.slice(2); return d; };
$('#num').addEventListener('input', () => { $('#numErr').textContent = ''; });
$('#num').addEventListener('blur', () => { const d = numerZPola(); if (d.length === 9) $('#num').value = fmtNum(d); });
$('#bankForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = numerZPola();
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

/* sprawdzenie kodu: w prawdziwym wdrożeniu robi to serwer mObywatela.
   Serwer liczy też błędne próby dla każdego numeru: po pięciu blokuje sprawdzanie na 5 minut. */
const LIMIT_PROB = 5, BLOKADA_MIN = 5, OKNO_WYGASLEGO_MIN = 10;
const proby = {};   // numer telefonu -> { n: błędne próby, do: koniec blokady }
const godzOd = t => new Date(t).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const kodAktywnyDla = numer => kod && !kod.uzyty && Date.now() <= kod.wygasa && kod.numer === numer;

function sprawdz(wpisany, numerTelefonu, imieWlasciciela) {
  const p = proby[numerTelefonu] = proby[numerTelefonu] || { n: 0, do: 0 };
  if (p.do > Date.now()) return { stan: 'blokada', do: godzOd(p.do) };

  // prawdziwy kod, ale po czasie: to nie oszustwo, wystarczy nowy kod.
  // Rozpoznajemy go tylko przez 10 minut po wygaśnięciu i tylko raz; potem liczy się jak błędny kod.
  if (kod && !kod.uzyty && !kod.wygaslyPokazany && wpisany === kod.kod
      && Date.now() > kod.wygasa && Date.now() <= kod.wygasa + OKNO_WYGASLEGO_MIN * 60000) {
    kod.wygaslyPokazany = true;
    statusBanku('warn', 'alert', 'Klient wpisał kod po czasie. Utwórz nowy kod i podaj go jeszcze raz.');
    return { stan: 'wygasl', bank: BANK };
  }

  // kod, którego nie ma: liczymy próbę i dajemy znać konsultantowi, jeśli czeka na tego klienta
  if (!kod || kod.uzyty || wpisany !== kod.kod || Date.now() > kod.wygasa) {
    p.n++;
    const czeka = kodAktywnyDla(numerTelefonu);
    if (p.n >= LIMIT_PROB) {
      p.n = 0; p.do = Date.now() + BLOKADA_MIN * 60000;
      if (czeka) statusBanku('bad', 'alert', `Klient ${LIMIT_PROB} razy wpisał błędny kod. Sprawdzanie na tym numerze jest wstrzymane do ${godzOd(p.do)}.`);
      return { stan: 'blokada', do: godzOd(p.do) };
    }
    if (czeka) statusBanku('warn', 'alert', `Klient wpisał błędny kod (próba ${p.n} z ${LIMIT_PROB}). Powtórz kod wolniej.`);
    return { stan: 'zly', zostalo: LIMIT_PROB - p.n };
  }

  kod.uzyty = true; clearInterval(licznik);
  const godz = hhmm();
  $('#timer').textContent = 'Wykorzystany o ' + godz;
  if (kod.numer !== numerTelefonu) {
    statusBanku('bad', 'alert', 'Kod wpisano na innym numerze niż ten, pod który dzwonisz. Możliwe oszustwo, sprawa trafi do weryfikacji.');
    return { stan: 'numer', godz, bank: BANK };
  }
  p.n = 0;
  if (kod.imie && norm(kod.imie) !== norm(imieWlasciciela)) {
    statusBanku('warn', 'alert', 'Numer zgadza się, ale należy do innej osoby niż Twój klient. Zakończ rozmowę bez podawania szczegółów.');
    return { stan: 'osoba', godz, bank: BANK };
  }
  statusBanku('ok', 'check', 'Klient potwierdził rozmowę o ' + godz + '. Nie otrzymujesz żadnych jego danych.');
  return { stan: 'ok', godz, bank: BANK, znaImie: !!kod.imie };
}

/* ---------- telefony w ramkach ---------- */
const ramka = $('#telefon');      // Marta
const ramka2 = $('#telefon2');    // Kacper, tylko w scenariuszu „Dwóch klientów”
let scen = 1;
const doTelefonu = (r, msg) => r.contentWindow && r.contentWindow.postMessage(Object.assign({ zrodlo: 'bank' }, msg), '*');
const trybMarty = () => (scen === 2 ? 'in' : tryb);

function ustawTryb(t, zTelefonu) {
  tryb = t;
  $$('.opt').forEach(o => { const on = o.dataset.mode === t; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on); });
  if (!zTelefonu) doTelefonu(ramka, { typ: 'wf-tryb', tryb: trybMarty() });
}
$$('.opt').forEach(o => o.addEventListener('click', () => ustawTryb(o.dataset.mode)));

function ustawScenariusz(n) {
  scen = n === 2 ? 2 : 1;
  $$('.tab').forEach(t => {
    const on = +t.dataset.scen === scen;
    t.classList.toggle('on', on);
    const l = t.querySelector('.lbl'); if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
  });
  $$('.tylko1').forEach(e => { e.hidden = scen !== 1; });
  $$('.tylko2').forEach(e => { e.hidden = scen !== 2; });
  if (scen === 2 && !ramka2.getAttribute('src')) ramka2.setAttribute('src', ramka2.dataset.src);
  doTelefonu(ramka, { typ: 'wf-tryb', tryb: trybMarty() });
  try { history.replaceState(null, '', scen === 2 ? '#two-customers' : '#one-customer'); } catch (e) {}
  dopasuj();
}
$$('.tab').forEach(t => t.addEventListener('click', () => ustawScenariusz(+t.dataset.scen)));

function pokazOsobe(m) {
  $('#telLabel').textContent = `Telefon ${m.dopelniacz} · ${m.numerTxt}`;
  $('#whoAv').textContent = (m.imie[0] + m.nazwisko[0]).toUpperCase();
  $('#whoName').textContent = m.imie + ' ' + m.nazwisko;
  $('#whoIn').textContent = (m.plec === 'K' ? 'zalogowana' : 'zalogowany') + ' w mObywatelu';
  $('#whoOut').textContent = 'aplikacja wcześniej połączona z telefonem ' + m.dopelniacz;
  const c = $('#whoCard');
  c.textContent = '';
  c.append('Numer ', Object.assign(document.createElement('b'), { textContent: m.numerTxt }),
    ` jest potwierdzony SMS-em w profilu ${m.dopelniacz}. Sprawdzenie działa w obu stanach, bo serwer zna numer przypisany do tego telefonu.`);
}

window.addEventListener('message', e => {
  const r = e.source === ramka.contentWindow ? ramka : e.source === ramka2.contentWindow ? ramka2 : null;
  if (!r) return;
  const m = e.data || {};
  if (m.zrodlo !== 'telefon') return;
  if (m.typ === 'wf-gotowy') {
    if (r === ramka) { pokazOsobe(m); doTelefonu(r, { typ: 'wf-tryb', tryb: trybMarty() }); }
    else { $('#telLabel2').textContent = `Telefon ${m.dopelniacz} · ${m.numerTxt}`; doTelefonu(r, { typ: 'wf-tryb', tryb: 'in' }); }
  }
  if (m.typ === 'wf-zalogowano' && r === ramka && scen === 1) ustawTryb('in', true);
  if (m.typ === 'wf-sprawdz') doTelefonu(r, { typ: 'wf-wynik', id: m.id, wynik: sprawdz(m.kod, m.numer, m.imie) });
});

/* ---------- zegar i skalowanie telefonów ---------- */
function zegar() { $$('.clock').forEach(c => { c.textContent = hhmm(); }); }
zegar(); setInterval(zegar, 15000);

function dopasuj() {
  const top = $('.topbar').offsetHeight;
  const vw = document.documentElement.clientWidth || innerWidth;
  let s = vw <= 760
    ? Math.min(1, (Math.min(vw, 452) - 32 - 22) / 390)
    : Math.min(1, Math.max(0.55, (innerHeight - top - 110) / 844));
  if (scen === 2 && vw > 1180) s = Math.max(0.45, Math.min(s, (vw - 460 - 64 - 28 - 44) / 780));
  $$('.phone-wrap').forEach(w => {
    w.style.width = 390 * s + 'px'; w.style.height = 844 * s + 'px';
    w.querySelector('.phone').style.transform = `scale(${s})`;
  });
}
addEventListener('resize', dopasuj);
if ('ResizeObserver' in window) new ResizeObserver(dopasuj).observe(document.documentElement);

// przyciski animacji mają napisy, dopóki mieszczą się obok zakładek; inaczej zostają same ikony
function dopasujPasek() {
  const zakladki = $('.tabs');
  document.body.classList.remove('ikony');
  const uciete = zakladki.scrollWidth > zakladki.clientWidth + 1 || [...zakladki.querySelectorAll('.lbl')].some(l => l.scrollWidth > l.clientWidth);
  if (uciete) document.body.classList.add('ikony');
}
addEventListener('resize', dopasujPasek);
if ('ResizeObserver' in window) new ResizeObserver(dopasujPasek).observe($('.topbar'));
dopasujPasek();
document.fonts && document.fonts.ready.then(dopasujPasek);

ustawTryb('in', true);
ustawScenariusz(['#two-customers', '#dwoch-klientow'].includes(location.hash) ? 2 : 1);   // stara polska kotwica też działa
otworzPop($('[data-pop="pop-about"]'));   // po wejściu na stronę od razu widać opis pomysłu
