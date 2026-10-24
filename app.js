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
   Serwer liczy też błędne próby dla każdego numeru: po trzech blokuje sprawdzanie na 5 minut. */
const LIMIT_PROB = 3, BLOKADA_MIN = 5;
const proby = {};   // numer telefonu -> { n: błędne próby, do: koniec blokady }
const godzOd = t => new Date(t).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const kodAktywnyDla = numer => kod && !kod.uzyty && Date.now() <= kod.wygasa && kod.numer === numer;

function sprawdz(wpisany, numerTelefonu, imieWlasciciela) {
  const p = proby[numerTelefonu] = proby[numerTelefonu] || { n: 0, do: 0 };
  if (p.do > Date.now()) return { stan: 'blokada', do: godzOd(p.do), bank: BANK };

  // prawdziwy kod, ale po czasie: to nie oszustwo, wystarczy nowy kod
  if (kod && !kod.uzyty && wpisany === kod.kod && Date.now() > kod.wygasa) {
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
      return { stan: 'blokada', do: godzOd(p.do), bank: BANK };
    }
    if (czeka) statusBanku('warn', 'alert', `Klient wpisał błędny kod (próba ${p.n} z ${LIMIT_PROB}). Powtórz kod wolniej.`);
    return { stan: 'zly', zostalo: LIMIT_PROB - p.n, bank: BANK };
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
  return { stan: 'ok', godz, bank: BANK };
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
  try { history.replaceState(null, '', scen === 2 ? '#dwoch-klientow' : '#jeden-klient'); } catch (e) {}
  dopasuj();
}
$$('.tab .lbl').forEach(b => b.addEventListener('click', () => ustawScenariusz(+b.closest('.tab').dataset.scen)));

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

ustawTryb('in', true);
ustawScenariusz(location.hash === '#dwoch-klientow' ? 2 : 1);
